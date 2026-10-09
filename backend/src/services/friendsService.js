import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ConversationModel, FriendRequestModel, UserModel } from "#src/models/index.js";
import { blockerBetween, presenceShownTo } from "#src/services/blockService.js";
import { directConversationIdOf, populateMembers } from "#src/services/conversationService.js";
import { expiryFor } from "#src/services/disappearingService.js";
import { currentKeyIdOf } from "#src/services/keyService.js";
import { saveMessage, validateCipher } from "#src/services/messageService.js";
import { assertNoCooldown, cooldownsOf, startCooldown } from "#src/services/requestCooldownService.js";
import { forgetSuggestionsBetween } from "#src/services/suggestionService.js";

const FRIEND_FIELDS = "firstName lastName username avatar cover coverStyle activityStatus onlineStatus publicKeys.keyId";
// every key they ever had, so a note still opens after its sender moves to a new one
const REQUESTER_FIELDS = "firstName lastName username avatar cover coverStyle activityStatus createdAt publicKeys";

const MAX_OPEN_REQUESTS = 30;
// room for 200 characters once sealed, the limit the browser counts down to
const MAX_NOTE_LENGTH = 2048;
// long enough to fix a wrong person or a typo, too short to keep pinging someone by sending and cancelling
const FREE_CANCEL_MS = 5 * 60 * 1000;

const assertUserId = (user_id, field) => {
  if (!mongoose.isValidObjectId(user_id)) throw createHttpError.BadRequest(`Required field: ${field}`);
};

const assertNotSelf = (user_id, other_id) => {
  if (String(user_id) === String(other_id)) throw createHttpError.BadRequest("That is your own account");
};

const isFriendOf = (user, other_id) => user.friends.some((friend_id) => friend_id.equals(other_id));

const pairOf = (one_id, other_id) => [String(one_id), String(other_id)].sort().join(":");

const theyAskedFirst = () =>
  createHttpError(409, "They already sent you a request, accept it from your requests", { code: "request_incoming" });

const assertReceiverHasKey = (receiver) => {
  if (!currentKeyIdOf(receiver)) {
    throw createHttpError(409, `${receiver.firstName} hasn't set up encryption yet, so a request to them goes without a note`, {
      code: "recipient_has_no_key",
    });
  }
};

// the checks run together, and a block reads as a decline while its cooldown runs, so the cooldown's refusal wins
const requestableReceiver = async (sender, receiver_id) => {
  assertUserId(receiver_id, "receiver_id");
  assertNotSelf(sender._id, receiver_id);

  const receiver = await UserModel.findOne({ _id: receiver_id, verified: true });
  if (!receiver) throw createHttpError.NotFound("User does not exist");
  if (isFriendOf(sender, receiver._id)) throw createHttpError.BadRequest("You are already friends");

  const [, blocker, alreadySent, alreadyReceived] = await Promise.all([
    assertNoCooldown(sender._id, receiver),
    blockerBetween(sender._id, receiver._id),
    FriendRequestModel.exists({ sender: sender._id, recipient: receiver._id }),
    FriendRequestModel.exists({ sender: receiver._id, recipient: sender._id }),
  ]);
  if (blocker) throw createHttpError.Forbidden("You can't send this person a request");
  if (alreadySent) throw createHttpError.BadRequest("Friend request already sent");
  if (alreadyReceived) throw theyAskedFirst();

  return receiver;
};

// the chat a note is sealed for: the one the two already share, or a fresh id their chat is made with on accept
export const noteTargetFor = async (sender, receiver_id) => {
  const receiver = await requestableReceiver(sender, receiver_id);
  assertReceiverHasKey(receiver);

  const conversationId = (await directConversationIdOf(sender._id, receiver._id)) ?? new mongoose.Types.ObjectId();
  return { conversationId, publicKeys: receiver.publicKeys };
};

const isUnusedId = async (conversationId) =>
  mongoose.isValidObjectId(conversationId) && !(await ConversationModel.exists({ _id: conversationId }));

const checkedNote = async (sender, receiver, { conversationId, cipher } = {}) => {
  assertReceiverHasKey(receiver);
  if (typeof cipher?.data === "string" && cipher.data.length > MAX_NOTE_LENGTH) throw createHttpError.BadRequest("Keep the note under 200 characters");
  validateCipher(cipher, { isGroup: false, users: [sender, receiver] }, sender._id);

  const [existing, isUnused] = await Promise.all([directConversationIdOf(sender._id, receiver._id), isUnusedId(conversationId)]);
  const isTheirChat = existing ? existing.equals(conversationId) : isUnused;
  if (!isTheirChat) throw createHttpError(409, "Reload Whisprl and try again", { code: "note_target_changed" });

  return { conversationId, note: cipher };
};

export const sendFriendRequest = async (sender, receiver_id, note) => {
  const receiver = await requestableReceiver(sender, receiver_id);
  const [openCount, sealed] = await Promise.all([FriendRequestModel.countDocuments({ sender: sender._id }), note ? checkedNote(sender, receiver, note) : {}]);
  if (openCount >= MAX_OPEN_REQUESTS) {
    throw createHttpError(429, `You have ${MAX_OPEN_REQUESTS} requests waiting. Cancel some to send more`, { code: "too_many_open_requests" });
  }

  try {
    await FriendRequestModel.create({ sender: sender._id, recipient: receiver._id, pair: pairOf(sender._id, receiver._id), ...sealed });
  } catch (error) {
    if (error.code !== 11000) throw error;
    // two people asking each other at the same moment: only one request can stand
    if (await FriendRequestModel.exists({ sender: receiver._id, recipient: sender._id })) throw theyAskedFirst();
    throw createHttpError.BadRequest("Friend request already sent");
  }
  return receiver;
};

export const cancelFriendRequest = async (sender_id, receiver_id) => {
  assertUserId(receiver_id, "receiver_id");

  const request = await FriendRequestModel.findOneAndDelete({ sender: sender_id, recipient: receiver_id });
  if (!request) throw createHttpError.NotFound("That request is no longer waiting");
  if (Date.now() - request.createdAt > FREE_CANCEL_MS) await startCooldown(sender_id, receiver_id);
};

// marked read at the moment of accepting, so the sender never learns when it was first opened
const continueChat = async (request, receiver) => {
  if (!request.note) return null;

  const conversation =
    (await ConversationModel.findById(request.conversationId)) ??
    (await ConversationModel.create({
      _id: request.conversationId,
      name: `${receiver.firstName} ${receiver.lastName}`,
      isGroup: false,
      users: [request.sender, request.recipient],
    }));

  const acceptedAt = new Date();
  await saveMessage(await populateMembers(conversation), {
    sender: request.sender,
    cipher: request.note.toObject(),
    deliveredAt: acceptedAt,
    seenAt: acceptedAt,
    expiresAt: expiryFor(conversation),
  });
  return conversation;
};

// claiming the request first gives an accept racing a cancel exactly one winner
export const answerFriendRequest = async (receiver, sender_id, action) => {
  assertUserId(sender_id, "sender_id");
  assertNotSelf(receiver._id, sender_id);
  if (!["accept", "reject"].includes(action)) throw createHttpError.BadRequest("Required Fields: sender_id, action_type");

  const request = await FriendRequestModel.findOneAndDelete({ sender: sender_id, recipient: receiver._id });
  if (!request) throw createHttpError.NotFound("That request is no longer waiting");

  if (action === "reject") {
    await Promise.all([startCooldown(sender_id, receiver._id), forgetSuggestionsBetween(sender_id, receiver._id)]);
    return null;
  }

  await Promise.all([
    UserModel.updateOne({ _id: sender_id }, { $addToSet: { friends: receiver._id } }),
    UserModel.updateOne({ _id: receiver._id }, { $addToSet: { friends: sender_id } }),
  ]);
  return continueChat(request, receiver);
};

export const unfriend = async (user, friend_id) => {
  assertUserId(friend_id, "friend_id");
  assertNotSelf(user._id, friend_id);
  if (!isFriendOf(user, friend_id)) throw createHttpError.NotFound("Friend not found in your friends list");

  await Promise.all([
    UserModel.updateOne({ _id: user._id }, { $pull: { friends: friend_id } }),
    UserModel.updateOne({ _id: friend_id }, { $pull: { friends: user._id } }),
    forgetSuggestionsBetween(user._id, friend_id),
  ]);
};

export const listFriends = async (user) => presenceShownTo(user, await UserModel.find({ _id: { $in: user.friends } }).select(FRIEND_FIELDS).lean());

export const listOnlineFriends = (user) =>
  UserModel.find({ _id: { $in: user.friends, $nin: user.blocked }, blocked: { $ne: user._id }, onlineStatus: "online" }).select(
    "firstName lastName avatar onlineStatus"
  );

const withPerson = (requests, field) =>
  requests
    .filter((request) => request[field])
    .map(({ _id, note, conversationId, createdAt, [field]: person }) => ({ _id, person, note, conversationId, createdAt }));

// nothing here says whether a note was read, so the sender learns nothing until an answer
export const listRequests = async (user_id) => {
  const [received, sent, cooldowns] = await Promise.all([
    FriendRequestModel.find({ recipient: user_id }).populate("sender", REQUESTER_FIELDS).lean(),
    FriendRequestModel.find({ sender: user_id }).populate("recipient", REQUESTER_FIELDS).lean(),
    cooldownsOf(user_id),
  ]);
  return { incoming: withPerson(received, "sender"), outgoing: withPerson(sent, "recipient"), cooldowns };
};
