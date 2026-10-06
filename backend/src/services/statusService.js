import createHttpError from "http-errors";
import mongoose from "mongoose";

import { StatusModel, UserModel } from "#src/models/index.js";
import { blockedEitherWay } from "#src/services/blockService.js";
import { deleteFile, uploadFile } from "#src/services/fileUploadService.js";
import { validateCipher } from "#src/services/messageService.js";

const STATUS_LIFETIME_MS = 24 * 60 * 60 * 1000;
const PERSON_FIELDS = "firstName lastName username avatar";
const OWNER_FIELDS = `${PERSON_FIELDS} publicKeys`;
const SWEEP_BATCH = 500;

const STATUS_GONE = "This status is no longer available";

// the owner, and every friend not hidden from it or blocked either way who has a key to seal it for
export const sealedForOf = async (user) => {
  const left = await blockedEitherWay(user, user.friends);
  user.statusHiddenFrom.forEach((id) => left.add(String(id)));
  const ids = user.friends.filter((id) => !left.has(String(id)));
  return UserModel.find({ _id: { $in: ids }, "publicKeys.0": { $exists: true } }).select("publicKeys");
};

const parseCipher = (cipherJson) => {
  try {
    return JSON.parse(cipherJson);
  } catch {
    throw createHttpError.BadRequest("A status must be encrypted. Reload Whisprl to get the latest version.");
  }
};

// the owner sees who viewed it; everyone else only whether they have
const toClientStatus = (status, user_id) => {
  const { _id, owner, cipher, file, createdAt, expiresAt, views } = status.toObject();
  const isOwn = String(owner._id) === String(user_id);
  return {
    _id,
    owner,
    cipher,
    file,
    createdAt,
    expiresAt,
    ...(isOwn ? { views } : { isViewed: views.some((view) => String(view.user._id) === String(user_id)) }),
  };
};

export const postStatus = async (user, cipherJson, file) => {
  const cipher = parseCipher(cipherJson);
  const sealedFor = await sealedForOf(user);
  validateCipher(cipher, { isGroup: true, users: sealedFor }, user._id);

  const url = file && (await uploadFile(`Status/${user._id}`, { buffer: file.buffer, mimetype: "application/octet-stream" }));
  const status = await StatusModel.create({
    owner: user._id,
    cipher,
    file: url ? { url, size: file.size } : undefined,
    audience: sealedFor.filter((person) => !person._id.equals(user._id)).map((person) => person._id),
    expiresAt: new Date(Date.now() + STATUS_LIFETIME_MS),
  });
  await status.populate("owner", OWNER_FIELDS);
  return { status, forOwner: toClientStatus(status, user._id), forAudience: toClientStatus(status, null) };
};

export const listStatuses = async (user) => {
  const blocked = await blockedEitherWay(user, user.friends);
  const shownOwners = user.friends.filter((id) => !blocked.has(String(id)));
  const statuses = await StatusModel.find({
    expiresAt: { $gt: new Date() },
    $or: [{ owner: user._id }, { audience: user._id, owner: { $in: shownOwners } }],
  })
    .sort({ createdAt: 1 })
    .populate("owner", OWNER_FIELDS)
    .populate("views.user", PERSON_FIELDS);
  return statuses.map((status) => toClientStatus(status, user._id));
};

// a second look at the same status counts once
export const markViewed = async (user, status_id) => {
  if (!mongoose.isValidObjectId(status_id)) throw createHttpError.NotFound(STATUS_GONE);
  const view = { user: user._id, viewedAt: new Date() };
  const status = await StatusModel.findOneAndUpdate(
    { _id: status_id, audience: user._id, expiresAt: { $gt: new Date() }, "views.user": { $ne: user._id } },
    { $push: { views: view } }
  ).select("owner");
  return status && { owner: status.owner, view };
};

export const removeStatus = async (user, status_id) => {
  if (!mongoose.isValidObjectId(status_id)) throw createHttpError.NotFound(STATUS_GONE);
  const status = await StatusModel.findOneAndDelete({ _id: status_id, owner: user._id }).select("audience file");
  if (!status) throw createHttpError.NotFound(STATUS_GONE);
  if (status.file) await deleteFile(status.file.url).catch(() => {});
  return status;
};

export const sweepExpiredStatuses = async () => {
  const expired = await StatusModel.find({ expiresAt: { $lte: new Date() } }).select("file").limit(SWEEP_BATCH).lean();
  if (!expired.length) return;
  await StatusModel.deleteMany({ _id: { $in: expired.map((status) => status._id) } });
  await Promise.all(expired.filter((status) => status.file).map((status) => deleteFile(status.file.url).catch(() => {})));
};

// only friends can be hidden from, and the list applies to statuses shared after it changes
export const setHiddenFrom = async (user, ids) => {
  if (!Array.isArray(ids)) throw createHttpError.BadRequest("Choose who to hide your status from");
  const friendIds = new Set(user.friends.map(String));
  const hiddenFrom = [...new Set(ids.map(String))].filter((id) => friendIds.has(id) && id !== String(user._id));
  await UserModel.updateOne({ _id: user._id }, { statusHiddenFrom: hiddenFrom });
  return hiddenFrom;
};
