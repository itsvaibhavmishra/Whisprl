import { createECDH } from "node:crypto";
import createHttpError from "http-errors";

import { UserModel } from "#src/models/index.js";
import { keyIdOf } from "#src/services/keyService.js";
import { endAllSessions } from "#src/services/sessionService.js";
import { randomCoverStyle } from "#src/utils/coverStyles.js";

const WHISPRL_EMAIL = "whisprlai@gmail.com";

let whisprlId = null;

export const whisprlAccountId = () => whisprlId;

export const isWhisprl = (id) => Boolean(whisprlId) && String(id) === whisprlId;

export const assertNotWhisprl = (id, refusal) => {
  if (isWhisprl(id)) throw createHttpError.BadRequest(refusal);
};

// its private key is never kept, so messages sent to Whisprl reach it sealed and nobody can ever open them
const keyNobodyHolds = () => {
  const publicKey = createECDH("prime256v1").generateKeys("base64");
  return { keyId: keyIdOf(publicKey), publicKey, createdAt: new Date() };
};

const whisprlProfile = () => ({
  email: WHISPRL_EMAIL,
  firstName: "Whisprl",
  lastName: "",
  username: "whisprl",
  avatar: `${process.env.FRONT_URL}/whisprl-avatar.webp`,
  badge: "official",
  verified: true,
  coverStyle: randomCoverStyle(),
});

// the address is Whisprl's own, so an ordinary account already on it becomes Whisprl and nobody can sign in to it again
const becomeWhisprl = async () => {
  const existing = await UserModel.findOne({ email: WHISPRL_EMAIL }).select("_id");
  if (!existing) return UserModel.create({ ...whisprlProfile(), publicKeys: [keyNobodyHolds()] });
  await endAllSessions(existing._id);
  // its old keys stay listed, as every key change keeps them, so messages already sent to it still open for their senders
  await UserModel.updateOne(
    { _id: existing._id },
    {
      $set: whisprlProfile(),
      $push: { publicKeys: keyNobodyHolds() },
      $unset: { password: 1, keyBackup: 1, role: 1, permissions: 1, journey: 1, deletion: 1, cover: 1 },
    }
  );
  return existing;
};

// everyone has Whisprl as a friend, so accounts made before it existed are given it too; it keeps no list of its own
export const ensureWhisprl = async () => {
  const whisprl = (await UserModel.findOne({ badge: "official" }).select("_id")) ?? (await becomeWhisprl());
  whisprlId = String(whisprl._id);
  await UserModel.updateMany(
    { _id: { $ne: whisprl._id }, verified: true, deletedAt: { $exists: false }, friends: { $ne: whisprl._id } },
    { $addToSet: { friends: whisprl._id } }
  );
};

export const befriendWhisprl = (user) => {
  if (whisprlId) user.friends.addToSet(whisprlId);
};
