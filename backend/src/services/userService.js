import createHttpError from "http-errors";
import sizeOf from "image-size";
import mongoose from "mongoose";
import validator from "validator";

import { ConversationModel, FriendRequestModel, MessageModel, UserModel } from "../models/index.js";
import { deleteFile, isCloudinaryFile, uploadFile } from "./fileUploadService.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { assertStrongPassword, normalizeEmail } from "../utils/accountRules.js";

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

export const PUBLIC_PROFILE_FIELDS = "firstName lastName avatar cover email activityStatus createdAt publicKeys";

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
    avatar: user.avatar,
    cover: user.cover,
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

const nameOrEmailFilter = (keyword) => {
  if (validator.isEmail(keyword)) return { email: normalizeEmail(keyword) };

  const pattern = new RegExp(escapeRegex(keyword), "i");
  return {
    $or: [
      { firstName: pattern },
      { lastName: pattern },
      { $expr: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: pattern } } },
    ],
  };
};

export const searchForUsers = async (keyword, page, user) => {
  const filter = { ...nameOrEmailFilter(keyword), _id: { $nin: user.friends }, verified: true };

  const [users, totalCount, requestedIds] = await Promise.all([
    UserModel.find(filter)
      .select("firstName lastName email avatar activityStatus onlineStatus")
      .skip(skipFor(page))
      .limit(SEARCH_PAGE_SIZE)
      .lean(),
    UserModel.countDocuments(filter),
    FriendRequestModel.find({ sender: user._id }).distinct("recipient"),
  ]);

  const requested = new Set(requestedIds.map(String));
  return { users: users.map((found) => ({ ...found, requestSent: requested.has(String(found._id)) })), totalCount };
};

export const searchFriendsOf = async (user, keyword, page) => {
  const filter = { ...nameOrEmailFilter(keyword), _id: { $in: user.friends } };

  const [friends, totalCount] = await Promise.all([
    UserModel.find(filter)
      .select("firstName lastName email avatar activityStatus onlineStatus")
      .skip(skipFor(page))
      .limit(SEARCH_PAGE_SIZE),
    UserModel.countDocuments(filter),
  ]);

  return { friends, totalCount };
};
