import { randomBytes } from "node:crypto";

import { UserModel } from "#src/models/index.js";

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
