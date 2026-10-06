import createHttpError from "http-errors";
import mongoose from "mongoose";

import { FriendRequestModel, UserModel } from "#src/models/index.js";

const FRIEND_FIELDS = "firstName lastName avatar activityStatus onlineStatus email publicKeys.keyId";
const REQUESTER_FIELDS = "firstName lastName avatar activityStatus email";

const assertUserId = (user_id, field) => {
  if (!mongoose.isValidObjectId(user_id)) throw createHttpError.BadRequest(`Required field: ${field}`);
};

const assertNotSelf = (user_id, other_id) => {
  if (String(user_id) === String(other_id)) throw createHttpError.BadRequest("That is your own account");
};

const isFriendOf = (user, other_id) => user.friends.some((friend_id) => friend_id.equals(other_id));

export const sendFriendRequest = async (sender, receiver_id) => {
  assertUserId(receiver_id, "receiver_id");
  assertNotSelf(sender._id, receiver_id);

  const receiver = await UserModel.findOne({ _id: receiver_id, verified: true });
  if (!receiver) throw createHttpError.NotFound("User does not exist");
  if (isFriendOf(sender, receiver._id)) throw createHttpError.BadRequest("You are already friends");

  const [alreadySent, alreadyReceived] = await Promise.all([
    FriendRequestModel.exists({ sender: sender._id, recipient: receiver._id }),
    FriendRequestModel.exists({ sender: receiver._id, recipient: sender._id }),
  ]);
  if (alreadySent) throw createHttpError.BadRequest("Friend request already sent");
  if (alreadyReceived) throw createHttpError.BadRequest("They already sent you a request, accept it from your requests");

  await FriendRequestModel.create({ sender: sender._id, recipient: receiver._id });
  return receiver;
};

export const cancelFriendRequest = async (sender_id, receiver_id) => {
  assertUserId(receiver_id, "receiver_id");
  assertNotSelf(sender_id, receiver_id);

  const { deletedCount } = await FriendRequestModel.deleteOne({
    $or: [
      { sender: sender_id, recipient: receiver_id },
      { sender: receiver_id, recipient: sender_id },
    ],
  });
  if (!deletedCount) throw createHttpError.NotFound("Friend request not found");
};

export const answerFriendRequest = async (receiver_id, sender_id, action) => {
  assertUserId(sender_id, "sender_id");
  assertNotSelf(receiver_id, sender_id);
  if (!["accept", "reject"].includes(action)) throw createHttpError.BadRequest("Required Fields: sender_id, action_type");

  const request = await FriendRequestModel.findOneAndDelete({ sender: sender_id, recipient: receiver_id });
  if (!request) throw createHttpError.NotFound("Friend request not found");

  if (action === "accept") {
    await Promise.all([
      UserModel.updateOne({ _id: sender_id }, { $addToSet: { friends: receiver_id } }),
      UserModel.updateOne({ _id: receiver_id }, { $addToSet: { friends: sender_id } }),
    ]);
  }
};

export const unfriend = async (user, friend_id) => {
  assertUserId(friend_id, "friend_id");
  assertNotSelf(user._id, friend_id);
  if (!isFriendOf(user, friend_id)) throw createHttpError.NotFound("Friend not found in your friends list");

  await Promise.all([
    UserModel.updateOne({ _id: user._id }, { $pull: { friends: friend_id } }),
    UserModel.updateOne({ _id: friend_id }, { $pull: { friends: user._id } }),
  ]);
};

export const listFriends = (user) => UserModel.find({ _id: { $in: user.friends } }).select(FRIEND_FIELDS);

export const listOnlineFriends = (user) =>
  UserModel.find({ _id: { $in: user.friends }, onlineStatus: "online" }).select("firstName lastName avatar onlineStatus");

export const listReceivedRequests = (user_id) =>
  FriendRequestModel.find({ recipient: user_id }).populate("sender", REQUESTER_FIELDS);

export const listSentRequests = async (user_id) => {
  const requests = await FriendRequestModel.find({ sender: user_id }).populate("recipient", REQUESTER_FIELDS);

  return requests
    .filter(({ recipient }) => recipient)
    .map(({ recipient }) => ({ ...recipient.toObject(), isSent: true, receiverId: recipient._id }));
};
