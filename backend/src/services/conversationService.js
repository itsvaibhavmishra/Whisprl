import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ConversationModel, UserModel } from "../models/index.js";
import { PUBLIC_PROFILE_FIELDS } from "./userService.js";

export const MEMBER_FIELDS = `${PUBLIC_PROFILE_FIELDS} onlineStatus`;

// encryption pairs exactly two people, so group conversations stay out of every chat path
const DIRECT = { isGroup: false };

export const memberRooms = (conversation, exceptUserId) =>
  conversation.users.map((member) => String(member._id)).filter((userId) => userId !== String(exceptUserId));

// one answer for "missing" and "not yours", so ids cannot be probed
export const findMemberConversation = async (convo_id, user_id) => {
  const conversation = mongoose.isValidObjectId(convo_id)
    ? await ConversationModel.findOne({ _id: convo_id, users: user_id, ...DIRECT })
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

// a note to yourself has one member, so the match is on the exact set rather than on containing both
const findDirectConversation = async (members) => {
  const conversation = await ConversationModel.findOne({ ...DIRECT, users: { $all: members, $size: members.length } })
    .populate("users", MEMBER_FIELDS)
    .populate("latestMessage");

  return conversation && withLatestSender(conversation);
};

export const openDirectConversation = async (sender, receiver_id) => {
  if (!mongoose.isValidObjectId(receiver_id)) throw createHttpError.BadRequest("Something went wrong");

  const receiver = await UserModel.findOne({ _id: receiver_id, verified: true });
  if (!receiver) throw createHttpError.NotFound("Verified Receiver does not exist");

  const isValidFriendShip = sender.friends.some((id) => id.equals(receiver._id)) && receiver.friends.some((id) => id.equals(sender._id));
  const members = membersOf(sender._id, receiver._id);

  const existing = await findDirectConversation(members);
  if (existing) return { conversation: existing, isValidFriendShip, isNew: false };

  if (!isValidFriendShip) throw createHttpError.Forbidden("You are not friends with this user");

  const created = await ConversationModel.create({
    name: `${receiver.firstName} ${receiver.lastName}`,
    isGroup: false,
    users: members,
  });

  return { conversation: await created.populate("users", MEMBER_FIELDS), isValidFriendShip, isNew: true };
};

export const getUserConversations = async (user_id) => {
  const conversations = await ConversationModel.find({ users: user_id, ...DIRECT })
    .populate("users", MEMBER_FIELDS)
    .populate("latestMessage")
    .sort({ updatedAt: -1 });

  return withLatestSender(conversations);
};

export const getUserConversationIds = async (user_id) =>
  (await ConversationModel.find({ users: user_id, ...DIRECT }).distinct("_id")).map(String);
