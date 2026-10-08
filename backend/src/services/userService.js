import createHttpError from "http-errors";
import sizeOf from "image-size";
import mongoose from "mongoose";

import { ConversationModel, MessageModel, UserModel } from "#src/models/index.js";
import { deleteFile, isCloudinaryFile, uploadFile } from "#src/services/fileUploadService.js";
import { presenceShownTo } from "#src/services/blockService.js";
import { escapeRegex } from "#src/utils/escapeRegex.js";
import { assertStrongPassword, normalizeUsername } from "#src/utils/accountRules.js";
import { randomCoverStyle } from "#src/utils/coverStyles.js";

const PROFILE_IMAGES = {
  avatar: {
    noun: "photo",
    folder: "User Avatars",
    maxSize: 3 * 1024 * 1024,
    hasRightShape: ({ width, height }) => width === height,
  },
  cover: {
    noun: "cover",
    folder: "User Covers",
    maxSize: 5 * 1024 * 1024,
    hasRightShape: ({ width, height }) => Math.abs(width / height - 3) < 0.05,
  },
};

const ALLOWED_FORMATS = ["jpeg", "jpg", "png", "webp"];

export const PUBLIC_PROFILE_FIELDS = "firstName lastName username avatar cover coverStyle activityStatus createdAt publicKeys";

export const validateProfileImage = (kind, file) => {
  const { noun, maxSize, hasRightShape } = PROFILE_IMAGES[kind];
  if (!ALLOWED_FORMATS.includes(file.mimetype.split("/")[1])) {
    throw createHttpError.BadRequest("Use a JPG, PNG or WebP image");
  }
  if (file.size > maxSize) {
    throw createHttpError.BadRequest("That image is too large");
  }
  if (!hasRightShape(sizeOf(file.buffer))) {
    throw createHttpError.BadRequest(`Crop the ${noun} before uploading it`);
  }
};

const uploadProfileImage = (user, kind, file) => uploadFile(`${PROFILE_IMAGES[kind].folder}/${user._id}`, file);

export const setOnlineStatus = (user_id, onlineStatus) => UserModel.updateOne({ _id: user_id }, { onlineStatus });

// every upload is checked before any reaches Cloudinary, and replaced images go only once the user is saved
export const saveProfile = async (user, fields, uploads, removals) => {
  const kinds = Object.keys(PROFILE_IMAGES);
  kinds.filter((kind) => uploads[kind]).forEach((kind) => validateProfileImage(kind, uploads[kind]));

  const replaced = [];
  for (const kind of kinds) {
    if (!uploads[kind] && !removals[kind]) continue;
    replaced.push(user[kind]);
    user[kind] = uploads[kind] ? await uploadProfileImage(user, kind, uploads[kind]) : "";
  }

  user.set(fields);
  await user.save();
  await Promise.allSettled(replaced.filter(isCloudinaryFile).map(deleteFile));
};

// accounts made before covers had styles are each given one when the server starts
export const giveEveryoneACoverStyle = async () => {
  const missing = await UserModel.find({ coverStyle: { $exists: false } }).select("_id").lean();
  if (!missing.length) return 0;
  await UserModel.bulkWrite(
    missing.map(({ _id }) => ({ updateOne: { filter: { _id, coverStyle: { $exists: false } }, update: { coverStyle: randomCoverStyle() } } }))
  );
  return missing.length;
};

export const getPublicProfile = (user_id) => {
  if (!mongoose.isValidObjectId(user_id)) throw createHttpError.BadRequest("Query required");
  return UserModel.findById(user_id).select(PUBLIC_PROFILE_FIELDS);
};

export const getOwnProfile = async (user) => {
  const friendIds = user.friends.filter((friendId) => !friendId.equals(user._id));
  const [friendPreviews, conversationCount, messageCount] = await Promise.all([
    UserModel.find({ _id: { $in: friendIds } }).select("firstName lastName avatar").limit(5),
    ConversationModel.countDocuments({ users: user._id }),
    MessageModel.countDocuments({ sender: user._id }),
  ]);

  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    usernameChangedAt: user.usernameChangedAt,
    avatar: user.avatar,
    cover: user.cover,
    coverStyle: user.coverStyle,
    email: user.email,
    activityStatus: user.activityStatus,
    createdAt: user.createdAt,
    socialsConnected: user.socialsConnected,
    friendCount: friendIds.length,
    friendPreviews,
    conversationCount,
    messageCount,
  };
};

export const changePassword = async (user_id, currentPassword, newPassword) => {
  const user = await UserModel.findById(user_id).select("+password");
  if (!user.password) {
    throw createHttpError.BadRequest("You have no password yet. Log out and use Forgot your password to set one");
  }
  if (!(await user.correctPassword(String(currentPassword)))) {
    throw createHttpError.BadRequest("Your current password is incorrect");
  }
  assertStrongPassword(newPassword);

  user.password = newPassword;
  await user.save();
};

const SEARCH_PAGE_SIZE = 10;

const skipFor = (page) => Math.max(0, Number.parseInt(page, 10) || 0) * SEARCH_PAGE_SIZE;

const SEARCH_FIELDS = "firstName lastName username avatar activityStatus onlineStatus";
// presence is for friends, so strangers are found without it
const STRANGER_FIELDS = "firstName lastName username avatar activityStatus";

// never by email, so nobody can find out whether an address has an account
const nameOrUsernameFilter = (keyword) => {
  const pattern = new RegExp(escapeRegex(keyword), "i");
  const username = normalizeUsername(keyword);
  return {
    $or: [
      { firstName: pattern },
      { lastName: pattern },
      { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: pattern } } },
      ...(username ? [{ username: new RegExp(escapeRegex(username)) }] : []),
    ],
  };
};

export const searchForUsers = async (keyword, page, user) => {
  const filter = { ...nameOrUsernameFilter(keyword), _id: { $nin: user.friends }, verified: true };

  const [users, totalCount] = await Promise.all([
    UserModel.find(filter).select(STRANGER_FIELDS).skip(skipFor(page)).limit(SEARCH_PAGE_SIZE).lean(),
    UserModel.countDocuments(filter),
  ]);
  return { users, totalCount };
};

export const searchFriendsOf = async (user, keyword, page) => {
  const filter = { ...nameOrUsernameFilter(keyword), _id: { $in: user.friends } };

  const [found, totalCount] = await Promise.all([
    UserModel.find(filter).select(SEARCH_FIELDS).skip(skipFor(page)).limit(SEARCH_PAGE_SIZE).lean(),
    UserModel.countDocuments(filter),
  ]);
  const friends = await presenceShownTo(user, found);

  return { friends, totalCount };
};

const QUICK_REACTION_COUNT = 6;

// an emoji can be several code points joined together, but never letters or spaces
const isEmoji = (value) =>
  typeof value === "string" &&
  value.length <= 16 &&
  /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3/u.test(value) &&
  !/[\p{L}\s]/u.test(value);

export const setQuickReactions = async (user, reactions) => {
  const isValid =
    Array.isArray(reactions) &&
    reactions.length === QUICK_REACTION_COUNT &&
    reactions.every(isEmoji) &&
    new Set(reactions).size === reactions.length;
  if (!isValid) throw createHttpError.BadRequest(`Choose ${QUICK_REACTION_COUNT} different emoji`);

  user.quickReactions = reactions;
  await user.save();
  return reactions;
};
