import createHttpError from "http-errors";
import mongoose from "mongoose";

import { FriendRequestModel, UserModel } from "#src/models/index.js";

const BLOCKED_FIELDS = "firstName lastName username avatar";

const assertSomeoneElse = (user, other_id) => {
  if (!mongoose.isValidObjectId(other_id) || user._id.equals(other_id)) throw createHttpError.BadRequest("Choose someone else");
};

// a block withdraws any friend request between the two, so neither can reach the other that way either
export const blockUser = async (user, other_id) => {
  assertSomeoneElse(user, other_id);
  const other = await UserModel.findById(other_id).select(BLOCKED_FIELDS);
  if (!other) throw createHttpError.NotFound("User does not exist");

  await Promise.all([
    UserModel.updateOne({ _id: user._id }, { $addToSet: { blocked: other._id } }),
    FriendRequestModel.deleteMany({
      $or: [
        { sender: user._id, recipient: other._id },
        { sender: other._id, recipient: user._id },
      ],
    }),
  ]);
  return other;
};

export const unblockUser = async (user, other_id) => {
  assertSomeoneElse(user, other_id);
  await UserModel.updateOne({ _id: user._id }, { $pull: { blocked: other_id } });
};

export const listBlocked = async (user_id) => (await UserModel.findById(user_id).select("blocked").populate("blocked", BLOCKED_FIELDS)).blocked;

export const blockerBetween = async (one_id, other_id) => {
  const [blocker] = await UserModel.find({
    $or: [
      { _id: one_id, blocked: other_id },
      { _id: other_id, blocked: one_id },
    ],
  }).distinct("_id");
  return blocker ?? null;
};

export const blockedEitherWay = async (user, ids) => {
  const blockers = await UserModel.find({ _id: { $in: ids }, blocked: user._id }).distinct("_id");
  return new Set([...blockers, ...(user.blocked ?? [])].map(String));
};

export const withPresenceHidden = (people, hiddenIds) =>
  people.map((person) => (hiddenIds.has(String(person._id)) ? { ...person, onlineStatus: "offline" } : person));

// online status stays hidden both ways between two people once either has blocked the other
export const presenceShownTo = async (user, people) =>
  withPresenceHidden(people, await blockedEitherWay(user, people.map((person) => person._id)));

export const presenceAudienceOf = async (user) => {
  const hidden = await blockedEitherWay(user, user.friends);
  return user.friends.map(String).filter((friendId) => !hidden.has(friendId));
};
