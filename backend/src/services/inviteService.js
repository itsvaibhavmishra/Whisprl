import { randomBytes } from "node:crypto";

import { UserModel } from "#src/models/index.js";
import { sendFromWhisprl } from "#src/services/whisprlMessageService.js";

const INVITE_CODE = /^[\w-]{8}$/;

// made the first time it is asked for, and kept, so every link already shared keeps working
export const inviteCodeOf = async (userId) => {
  const { inviteCode } = await UserModel.findById(userId).select("+inviteCode").lean();
  if (inviteCode) return inviteCode;
  await UserModel.updateOne({ _id: userId, inviteCode: { $exists: false } }, { inviteCode: randomBytes(6).toString("base64url") });
  return inviteCodeOf(userId);
};

// null for a code nobody holds, which the page tells apart from a request that failed
export const inviterOf = async (code) =>
  INVITE_CODE.test(code) ? UserModel.findOne({ inviteCode: code }).select("firstName lastName username avatar").lean() : null;

// only an account still finding its first friend counts as joining through the link, and its inviter hears of it once
export const joinThroughInvite = async (io, user, code) => {
  const inviter = await inviterOf(code);
  if (!inviter || inviter._id.equals(user._id) || !user.journey?.startedAt || user.journey.firstFriendAt) return inviter;
  const { modifiedCount } = await UserModel.updateOne({ _id: user._id, invitedBy: { $exists: false } }, { invitedBy: inviter._id });
  if (modifiedCount) await sendFromWhisprl(io, inviter._id, { type: "inviteJoined", user: user._id, name: user.firstName, username: user.username });
  return inviter;
};
