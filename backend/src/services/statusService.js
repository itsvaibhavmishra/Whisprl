import createHttpError from "http-errors";
import mongoose from "mongoose";

import { StatusModel, UserModel } from "#src/models/index.js";
import { blockedEitherWay } from "#src/services/blockService.js";
import { deleteFile, uploadFile } from "#src/services/fileUploadService.js";
import { fileStatusReport } from "#src/services/reportService.js";
import { validateCipher } from "#src/services/messageService.js";
import { usernameProblemOf } from "#src/utils/accountRules.js";

const STATUS_LIFETIME_MS = 24 * 60 * 60 * 1000;
const PERSON_FIELDS = "firstName lastName username avatar";
const KEYED_FIELDS = `${PERSON_FIELDS} publicKeys`;
const SWEEP_BATCH = 500;

const STATUS_GONE = "This status is no longer available";
const CHOOSE_AUDIENCE = "Choose who can see this status";
const ONLY_MEDIA = "Only a photo or a video can be shared with everyone";
const DISCOVER_LIMIT = 100;
const MAX_ALT = 2000;
const MAX_MENTIONS = 20;
const PUBLIC_TYPES = ["image/jpeg", "image/gif", "video/mp4", "video/webm"];
const PREVIEW = /^data:image\/jpeg;base64,[\w+/=]+$/;
const MAX_PREVIEW = 64 * 1024;

const parseJson = (json, problem) => {
  try {
    return JSON.parse(json);
  } catch {
    throw createHttpError.BadRequest(problem);
  }
};

const chosenOf = (chosen) => (typeof chosen === "string" ? parseJson(chosen, CHOOSE_AUDIENCE) : chosen);

// no choice sent means Settings decide, so the default can never share wider than Settings allow, and nor can everyone
const audienceOf = (user, chosen) => {
  if (!chosen || chosen.everyone) return { except: new Set(user.statusHiddenFrom.map(String)) };
  const [mode] = Object.keys(chosen);
  if (!["only", "except"].includes(mode) || !Array.isArray(chosen[mode])) throw createHttpError.BadRequest(CHOOSE_AUDIENCE);
  return { [mode]: new Set(chosen[mode].map(String)) };
};

// the owner, and every friend in the chosen audience who is not blocked either way
const chosenFriendIdsOf = async (user, chosen) => {
  const { only, except } = audienceOf(user, chosen);
  const blocked = await blockedEitherWay(user, user.friends);
  const isChosen = (id) => id === String(user._id) || (only ? only.has(id) : !except.has(id));
  return user.friends.filter((id) => !blocked.has(String(id)) && isChosen(String(id)));
};

export const sealedForOf = async (user, chosen) =>
  UserModel.find({ _id: { $in: await chosenFriendIdsOf(user, chosenOf(chosen)) }, "publicKeys.0": { $exists: true } }).select("publicKeys");

// a friend sees an update shared with them, and anyone else an update for everyone they were not left out of
const visibleTo = (user) => ({ $or: [{ audience: user._id }, { isPublic: true, owner: { $ne: user._id }, excluded: { $ne: user._id } }] });

const finite = (value) => (Number.isFinite(value) ? value : undefined);

const fraction = (value) => Math.min(Math.max(finite(value) ?? 0, 0), 1);

// rebuilt from the known fields only, since strangers see an update for everyone exactly as it is stored
const publicContentOf = (json, friendIds) => {
  const content = parseJson(json, "This status could not be shared. Try again.");
  if (!["image", "video"].includes(content?.kind) || !PUBLIC_TYPES.includes(content.file?.mimeType)) throw createHttpError.BadRequest(ONLY_MEDIA);
  const canSee = (id) => mongoose.isValidObjectId(id) && friendIds.some((friendId) => friendId.equals(id));
  const isMention = (mention) => canSee(mention?.userId) && typeof mention.username === "string" && !usernameProblemOf(mention.username);
  const mentions = (Array.isArray(content.mentions) ? content.mentions : []).filter(isMention).slice(0, MAX_MENTIONS);
  const { mimeType, width, height, duration, preview } = content.file;
  const isPreview = typeof preview === "string" && preview.length <= MAX_PREVIEW && PREVIEW.test(preview);
  return {
    kind: content.kind,
    alt: typeof content.alt === "string" ? content.alt.slice(0, MAX_ALT) : undefined,
    mentions: mentions.map(({ userId, username, box }) => ({
      userId: String(userId),
      username,
      box: { x: fraction(box?.x), y: fraction(box?.y), width: fraction(box?.width), height: fraction(box?.height) },
    })),
    file: { mimeType, width: finite(width), height: finite(height), duration: finite(duration), preview: isPreview ? preview : undefined },
  };
};

// an update for everyone is stored as it is, since there is nobody in particular to seal it for
const sharedOf = async (user, { cipher, content, audience }, file) => {
  const isNotOwner = (id) => !id.equals(user._id);
  const chosen = chosenOf(audience);
  if (chosen?.everyone) {
    if (!file) throw createHttpError.BadRequest(ONLY_MEDIA);
    const friendIds = (await chosenFriendIdsOf(user, chosen)).filter(isNotOwner);
    return { isPublic: true, content: publicContentOf(content, friendIds), audience: friendIds, excluded: user.statusHiddenFrom };
  }
  const parsed = parseJson(cipher, "A status must be encrypted. Reload Whisprl to get the latest version.");
  const sealedFor = await sealedForOf(user, chosen);
  validateCipher(parsed, { isGroup: true, users: sealedFor }, user._id);
  return { cipher: parsed, audience: sealedFor.map((person) => person._id).filter(isNotOwner) };
};

// the owner sees who viewed it and how they reacted; everyone else only their own view and reaction
const toClientStatus = (status, user_id) => {
  const { _id, owner, isPublic, cipher, content, file, createdAt, expiresAt, views } = status.toObject();
  const isOwn = String(owner._id) === String(user_id);
  const ownView = views.find((view) => String(view.user._id ?? view.user) === String(user_id));
  return {
    _id,
    owner,
    ...(isPublic ? { isPublic, content } : { cipher }),
    file,
    createdAt,
    expiresAt,
    ...(isOwn ? { views } : { isViewed: Boolean(ownView), ownReaction: ownView?.reaction }),
  };
};

export const postStatus = async (user, body, file) => {
  const shared = await sharedOf(user, body, file);
  const url = file && (await uploadFile(`Status/${user._id}`, { buffer: file.buffer, mimetype: "application/octet-stream" }));
  const status = await StatusModel.create({
    owner: user._id,
    ...shared,
    file: url ? { url, size: file.size } : undefined,
    expiresAt: new Date(Date.now() + STATUS_LIFETIME_MS),
  });
  await status.populate("owner", KEYED_FIELDS);
  return { status, forOwner: toClientStatus(status, user._id), forAudience: toClientStatus(status, null) };
};

export const listStatuses = async (user) => {
  const blocked = await blockedEitherWay(user, user.friends);
  const shownOwners = user.friends.filter((id) => !blocked.has(String(id)));
  const statuses = await StatusModel.find({
    expiresAt: { $gt: new Date() },
    $or: [{ owner: user._id }, { owner: { $in: shownOwners }, ...visibleTo(user) }],
  })
    .sort({ createdAt: 1 })
    .populate("owner", KEYED_FIELDS)
    .populate("views.user", KEYED_FIELDS);
  return statuses.map((status) => toClientStatus(status, user._id));
};

// the newest from people who are not friends, since a friend's updates for everyone are in the friends list already
export const discoverStatuses = async (user) => {
  const live = { isPublic: true, expiresAt: { $gt: new Date() }, owner: { $nin: [user._id, ...user.friends] }, excluded: { $ne: user._id } };
  const newest = await StatusModel.find(live).sort({ createdAt: -1 }).limit(DISCOVER_LIMIT).populate("owner", KEYED_FIELDS);
  const blocked = await blockedEitherWay(user, newest.map((status) => status.owner._id));
  const shown = newest.filter((status) => !blocked.has(String(status.owner._id))).reverse();
  return shown.map((status) => toClientStatus(status, user._id));
};

// a second look at the same status counts once
export const markViewed = async (user, status_id) => {
  if (!mongoose.isValidObjectId(status_id)) throw createHttpError.NotFound(STATUS_GONE);
  const live = { _id: status_id, expiresAt: { $gt: new Date() }, ...visibleTo(user) };
  const status = await StatusModel.findOne(live).select("owner");
  if (!status || (await blockedEitherWay(user, [status.owner])).size) return null;
  const view = { user: user._id, viewedAt: new Date() };
  const { modifiedCount } = await StatusModel.updateOne({ ...live, "views.user": { $ne: user._id } }, { $push: { views: view } });
  return modifiedCount ? { owner: status.owner, view } : null;
};

// reacting also counts as viewing, and a second reaction replaces the first
export const reactToStatus = async (user, status_id, cipher) => {
  if (!mongoose.isValidObjectId(status_id)) throw createHttpError.NotFound(STATUS_GONE);
  const live = { _id: status_id, expiresAt: { $gt: new Date() }, ...visibleTo(user) };
  const status = await StatusModel.findOne(live).populate("owner", KEYED_FIELDS);
  const canReact = status && (status.isPublic || user.friends.some((friend_id) => friend_id.equals(status.owner._id)));
  if (!canReact || (await blockedEitherWay(user, [status.owner._id])).size) throw createHttpError.NotFound(STATUS_GONE);
  validateCipher(cipher, { isGroup: false, users: [status.owner, user] }, user._id);

  // each write is atomic, so a view arriving at the same moment can never leave two views for one person
  const viewedAt = new Date();
  const setReaction = () => StatusModel.updateOne({ ...live, "views.user": user._id }, { $set: { "views.$.reaction": cipher } });
  const addView = () => StatusModel.updateOne({ ...live, "views.user": { $ne: user._id } }, { $push: { views: { user: user._id, viewedAt, reaction: cipher } } });
  if (!(await setReaction()).matchedCount && !(await addView()).matchedCount) await setReaction();
  return { owner: status.owner._id, viewedAt, reaction: cipher };
};

// only an update for everyone can be reported, since nobody but its audience can read any other
export const reportStatus = async (user, status_id, report) => {
  if (!mongoose.isValidObjectId(status_id)) throw createHttpError.NotFound(STATUS_GONE);
  const status = await StatusModel.findOne({ _id: status_id, isPublic: true, ...visibleTo(user) }).select("owner");
  if (!status || (await blockedEitherWay(user, [status.owner])).size) throw createHttpError.NotFound(STATUS_GONE);
  await fileStatusReport(user, status, report);
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
