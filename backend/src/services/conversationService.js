import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ConversationModel, MessageModel, UserModel } from "#src/models/index.js";
import { blockedEitherWay, presenceShownTo, withPresenceHidden } from "#src/services/blockService.js";
import { preferencesOf } from "#src/services/chatPreferenceService.js";
import { PUBLIC_PROFILE_FIELDS } from "#src/services/userService.js";

export const MEMBER_FIELDS = `${PUBLIC_PROFILE_FIELDS} onlineStatus`;

const DIRECT = { isGroup: false };

// groups the old app made have no owner and no encryption, so they stay out of every chat path
const CURRENT = { $or: [DIRECT, { owner: { $exists: true } }] };

const MEMBERS = [
  { path: "users", select: MEMBER_FIELDS },
  { path: "formerUsers", select: MEMBER_FIELDS },
];

export const populateMembers = (conversation) => conversation.populate(MEMBERS);

export const QUOTED_FIELDS = "sender cipher attachment event deletedAt createdAt viewOnce viewedBy";

const PINNED = { path: "pins.message", select: QUOTED_FIELDS };
const LATEST_REACTION = { path: "latestReaction.message", select: `${QUOTED_FIELDS} batchId` };

const MAX_PINS = 3;
const UNREAD_CAP = 100;

// the lowest id a message saved at this moment can have, since an ObjectId starts with its creation time
export const firstIdAt = (date) => mongoose.Types.ObjectId.createFromTime(Math.floor(date.getTime() / 1000));

export const memberRooms = (conversation, exceptUserId) =>
  conversation.users.map((member) => String(member._id)).filter((userId) => userId !== String(exceptUserId));

// one answer for "missing" and "not yours", so ids cannot be probed
export const findMemberConversation = async (convo_id, user_id) => {
  const conversation = mongoose.isValidObjectId(convo_id)
    ? await ConversationModel.findOne({ _id: convo_id, users: user_id, ...CURRENT })
    : null;

  if (!conversation) {
    throw createHttpError.NotFound("Conversation does not exist");
  }

  return conversation;
};

const withLatestSender = (conversations) =>
  UserModel.populate(conversations, { path: "latestMessage.sender", select: MEMBER_FIELDS });

const membersOf = (sender_id, receiver_id) =>
  String(sender_id) === String(receiver_id) ? [sender_id] : [sender_id, receiver_id];

export const directConversationIdOf = async (one_id, other_id) =>
  (await ConversationModel.findOne({ ...DIRECT, users: { $all: [one_id, other_id], $size: 2 } }).select("_id").lean())?._id ?? null;

// a note to yourself has one member, so the match is on the exact set rather than on containing both
const findDirectConversation = async (members) => {
  const conversation = await ConversationModel.findOne({ ...DIRECT, users: { $all: members, $size: members.length } })
    .populate("users", MEMBER_FIELDS)
    .populate("latestMessage");

  return conversation && withLatestSender(conversation);
};

const presentedTo = async (viewer, conversation) => {
  const json = conversation.toJSON();
  return { ...json, users: await presenceShownTo(viewer, json.users) };
};

export const openDirectConversation = async (sender, receiver_id) => {
  if (!mongoose.isValidObjectId(receiver_id)) throw createHttpError.BadRequest("Something went wrong");

  const receiver = await UserModel.findOne({ _id: receiver_id, verified: true });
  if (!receiver) throw createHttpError.NotFound("Verified Receiver does not exist");

  const isValidFriendShip = sender.friends.some((id) => id.equals(receiver._id)) && receiver.friends.some((id) => id.equals(sender._id));
  const members = membersOf(sender._id, receiver._id);

  const existing = await findDirectConversation(members);
  if (existing) return { conversation: await presentedTo(sender, existing), isValidFriendShip, isNew: false };

  if (!isValidFriendShip) throw createHttpError.Forbidden("You are not friends with this user");

  const created = await ConversationModel.create({
    name: `${receiver.firstName} ${receiver.lastName}`,
    isGroup: false,
    users: members,
  });

  return { conversation: await presentedTo(sender, await created.populate("users", MEMBER_FIELDS)), isValidFriendShip, isNew: true };
};

// a group counts from the reader's last seen message, or from when they joined if they have read nothing yet
const unreadIn = (conversation, user_id, clearedAt) => {
  const reader = String(user_id);
  const readFrom = () => conversation.lastSeen?.get(reader) ?? firstIdAt(conversation.joinedAt.get(reader));
  const since = conversation.isGroup ? { _id: { $gt: readFrom() } } : { seenAt: null, awaitingKey: { $ne: true } };
  const afterClearing = clearedAt && { createdAt: { $gt: clearedAt } };

  return MessageModel.countDocuments(
    {
      conversation: conversation._id,
      sender: { $ne: user_id },
      event: { $exists: false },
      deletedAt: null,
      hiddenFor: { $ne: user_id },
      ...since,
      ...afterClearing,
    },
    { limit: UNREAD_CAP }
  );
};

const peerIdOf = (conversation, user) => conversation.users.find((member) => !member._id.equals(user._id))?._id ?? user._id;

// a direct chat carries on only while both are still friends and neither has blocked the other
const peerAccessOf = async (user, conversations) => {
  const peerIds = conversations.filter((conversation) => !conversation.isGroup).map((conversation) => peerIdOf(conversation, user));
  const [friendsBack, blocked] = await Promise.all([
    UserModel.find({ _id: { $in: peerIds }, friends: user._id }).distinct("_id"),
    blockedEitherWay(user, peerIds),
  ]);
  const isFriend = (id) => user.friends.some((friendId) => friendId.equals(id));
  const reachable = new Set(friendsBack.filter((id) => isFriend(id) && !blocked.has(String(id))).map(String));
  return { reachable, blocked };
};

export const getUserConversations = async (user) => {
  const conversations = await ConversationModel.find({ users: user._id, ...CURRENT })
    .populate(MEMBERS)
    .populate({ path: "latestMessage", select: "-hiddenFor" })
    .populate(LATEST_REACTION)
    .populate(PINNED)
    .sort({ updatedAt: -1 });

  await withLatestSender(conversations);
  const preferences = await preferencesOf(user._id, conversations.map((conversation) => conversation._id));
  const preferenceOf = (conversation) => preferences.get(String(conversation._id)) ?? {};
  const [{ reachable, blocked }, unreadCounts] = await Promise.all([
    peerAccessOf(user, conversations),
    Promise.all(conversations.map((conversation) => unreadIn(conversation, user._id, preferenceOf(conversation).clearedAt))),
  ]);

  return conversations.map((conversation, index) => {
    const preference = preferenceOf(conversation);
    const json = conversation.toJSON();
    const isClearedSince = (date) => Boolean(preference.clearedAt && date && new Date(date) <= preference.clearedAt);
    return {
      ...json,
      ...preference,
      users: withPresenceHidden(json.users, blocked),
      latestMessage: isClearedSince(json.latestMessage?.createdAt) ? null : json.latestMessage,
      latestReaction: isClearedSince(json.latestReaction?.at) ? null : json.latestReaction,
      unread: unreadCounts[index],
      canMessage: conversation.isGroup || reachable.has(String(peerIdOf(conversation, user))),
    };
  });
};

export const pinsOf = async (conversation) => (await conversation.populate(PINNED)).toJSON().pins;

// a reaction stands in its chat's row like a message would, so it moves the chat up as one does
export const noteReaction = async (conversation_id, reaction) => {
  const latestReaction = { ...reaction, at: new Date() };
  const conversation = await ConversationModel.findByIdAndUpdate(conversation_id, { latestReaction }, { new: true }).populate(LATEST_REACTION);
  return { conversation: conversation_id, latestReaction: conversation.toJSON().latestReaction };
};

// taking a reaction back clears it only while it is still the latest, and leaves the chat where it sits
export const forgetReaction = async (conversation_id, match) => {
  const cleared = await ConversationModel.findOneAndUpdate({ _id: conversation_id, ...match }, { $unset: { latestReaction: "" } }, { timestamps: false });
  return cleared && { conversation: conversation_id, latestReaction: null };
};

// a fourth pin replaces the oldest, as a chat keeps only the few that matter now
export const pinMessage = async (conversation_id, user_id, message_id) => {
  const conversation = await findMemberConversation(conversation_id, user_id);
  const message = mongoose.isValidObjectId(message_id)
    ? await MessageModel.exists({ _id: message_id, conversation: conversation._id, deletedAt: null, event: { $exists: false } })
    : null;
  if (!message) throw createHttpError.NotFound("Message does not exist");

  const isPinned = conversation.pins.some((pin) => pin.message.equals(message._id));
  if (!isPinned) {
    conversation.pins = [...conversation.pins, { message: message._id, by: user_id }].slice(-MAX_PINS);
    await conversation.save();
  }
  return { conversation, isNew: !isPinned };
};

export const unpinMessage = async (conversation_id, user_id, message_id) => {
  const conversation = await findMemberConversation(conversation_id, user_id);
  conversation.pins = conversation.pins.filter((pin) => String(pin.message) !== String(message_id));
  await conversation.save();
  return conversation;
};

export const findCommonGroups = async (user_id, other_id) => {
  if (!mongoose.isValidObjectId(other_id)) throw createHttpError.BadRequest("Choose someone to compare with");
  const groups = await ConversationModel.find({ isGroup: true, owner: { $exists: true }, users: { $all: [user_id, other_id] } })
    .select("name picture users")
    .sort({ updatedAt: -1 });
  return groups.map(({ _id, name, picture, users }) => ({ _id, name, picture, memberCount: users.length }));
};

export const getUserConversationIds = async (user_id) =>
  (await ConversationModel.find({ users: user_id, ...CURRENT }).distinct("_id")).map(String);
