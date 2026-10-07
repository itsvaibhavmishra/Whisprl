import crypto from "crypto";
import createHttpError from "http-errors";
import validator from "validator";

import { PasskeyModel, UserModel } from "#src/models/index.js";

// an uncompressed P-256 point: one marker byte, then 32 bytes each of x and y
const PUBLIC_KEY_BYTES = 65;
const IV_BYTES = 12;
const MAX_BACKUP_LENGTH = 1024;

const bytesOf = (value) => (typeof value === "string" && validator.isBase64(value) ? Buffer.from(value, "base64") : null);

const keyIdOf = (publicKey) => crypto.createHash("sha256").update(Buffer.from(publicKey, "base64")).digest("hex").slice(0, 16);

export const isSealed = (sealed, maxLength) => {
  const { iv, data } = sealed ?? {};
  return bytesOf(iv)?.length === IV_BYTES && typeof data === "string" && data.length <= maxLength && Boolean(bytesOf(data)?.length);
};

const validatePublicKey = (publicKey) => {
  const bytes = bytesOf(publicKey);
  if (bytes?.length !== PUBLIC_KEY_BYTES || bytes[0] !== 4) {
    throw createHttpError.BadRequest("That is not a valid public key");
  }
};

const validateBackup = (backup) => {
  if (!isSealed(backup, MAX_BACKUP_LENGTH)) {
    throw createHttpError.BadRequest("That is not a valid key backup");
  }
};

export const currentKeyIdOf = (user) => user.publicKeys.at(-1)?.keyId ?? null;

const KEYS_CHANGED = "Your keys changed on another device. Reload Whisprl and try again.";

// matching the key count the request started from makes the check and the write one step
const updateIfKeysUnchanged = async (user, update) => {
  const { matchedCount } = await UserModel.updateOne({ _id: user._id, publicKeys: { $size: user.publicKeys.length } }, update);
  if (!matchedCount) throw createHttpError.Conflict(KEYS_CHANGED);
};

export const getOwnKeys = async (user_id) => {
  const { publicKeys, keyBackup } = await UserModel.findById(user_id).select("publicKeys +keyBackup");
  return { publicKeys, keyBackup: keyBackup ?? null };
};

// replacing names the key the browser saw, so two browsers cannot both reset the account unseen
export const addAccountKey = async (user, { publicKey, backup, replacing = null }) => {
  validatePublicKey(publicKey);
  validateBackup(backup);

  if (currentKeyIdOf(user) !== replacing) {
    throw createHttpError.Conflict(KEYS_CHANGED);
  }

  const entry = { keyId: keyIdOf(publicKey), publicKey, createdAt: new Date() };
  await updateIfKeysUnchanged(user, {
    $push: { publicKeys: entry },
    $set: { keyBackup: { keyId: entry.keyId, iv: backup.iv, data: backup.data } },
  });
  // each passkey locked the old private key, so none can unlock until it is linked again
  await PasskeyModel.updateMany({ user: user._id }, { $unset: { keyBackup: 1 } });

  return [...user.publicKeys, entry];
};

export const replaceKeyBackup = async (user, backup) => {
  validateBackup(backup);

  if (!backup.keyId || backup.keyId !== currentKeyIdOf(user)) {
    throw createHttpError.Conflict(KEYS_CHANGED);
  }

  await updateIfKeysUnchanged(user, { $set: { keyBackup: { keyId: backup.keyId, iv: backup.iv, data: backup.data } } });
};

export const savePasskeyBackup = async (user, credentialId, backup) => {
  validateBackup(backup);
  if (backup.keyId !== currentKeyIdOf(user)) throw createHttpError.Conflict(KEYS_CHANGED);

  const { matchedCount } = await PasskeyModel.updateOne(
    { user: user._id, credentialId: String(credentialId) },
    { keyBackup: { keyId: backup.keyId, iv: backup.iv, data: backup.data } }
  );
  if (!matchedCount) throw createHttpError.NotFound("Passkey not found");
};

export const getPasskeyBackups = async (user_id) => {
  const passkeys = await PasskeyModel.find({ user: user_id, keyBackup: { $exists: true } }).select("credentialId transports +keyBackup");
  return passkeys.map(({ credentialId, transports, keyBackup }) => ({ credentialId, transports, keyBackup }));
};
