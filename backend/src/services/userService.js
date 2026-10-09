import createHttpError from "http-errors";
import sizeOf from "image-size";
import mongoose from "mongoose";

import { ConversationModel, FriendRequestModel, MessageModel, UserModel } from "#src/models/index.js";
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

// the status accounts once started with, under the app's old and new names, said nothing about anyone
const OLD_DEFAULT_STATUSES = ["Hey There! I ❤️ Using Whisprl 😸", "Hey There! I ❤️ Using TwinkChat 😸"];

export const clearDefaultStatuses = async () =>
  (await UserModel.updateMany({ activityStatus: { $in: OLD_DEFAULT_STATUSES } }, { activityStatus: "" })).modifiedCount;

const MUTUAL_PREVIEW = 3;

// everyone counts as their own friend, so both people are left out of what they share
const mutualFriendsOf = async (viewer, person_id, theirFriends) => {
  const theirs = new Set(theirFriends.map(String));
  const shared = viewer.friends.filter((friend_id) => theirs.has(String(friend_id)) && !friend_id.equals(viewer._id) && !friend_id.equals(person_id));
  const people = await UserModel.find({ _id: { $in: shared.slice(0, MUTUAL_PREVIEW) } }).select("firstName lastName avatar").lean();
  return { count: shared.length, people };
};

// shared friends show to a friend, to someone being asked, and to friends of friends unless the person turned suggestions off
const canSeeMutualFriends = async (viewer, person) => {
  if (viewer._id.equals(person._id)) return false;
  if (person.suggestToFriendsOfFriends !== false) return true;
  if (viewer.friends.some((friend_id) => friend_id.equals(person._id))) return true;
  return Boolean(await FriendRequestModel.exists({ sender: person._id, recipient: viewer._id }));
};

// a profile link names its person by username, everywhere else by id
export const getPublicProfile = async (viewer, { userId, username }) => {
  const filter = username ? { username: normalizeUsername(username) } : mongoose.isValidObjectId(userId) && { _id: userId };
  if (!filter) throw createHttpError.BadRequest("Query required");
  const person = await UserModel.findOne(filter).select(`${PUBLIC_PROFILE_FIELDS} friends suggestToFriendsOfFriends`).lean();
  if (!person) throw createHttpError.NotFound("User does not exist");

  const { friends, suggestToFriendsOfFriends, ...profile } = person;
  if (!(await canSeeMutualFriends(viewer, person))) return profile;
  return { ...profile, mutualFriends: await mutualFriendsOf(viewer, person._id, friends) };
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
// a scrolling list asks for more at a time, so it fetches less often
const PEOPLE_PAGE_SIZE = 20;

const skipFor = (page, size = SEARCH_PAGE_SIZE) => Math.max(0, Number.parseInt(page, 10) || 0) * size;

const SEARCH_FIELDS = "firstName lastName username avatar activityStatus onlineStatus";
// presence is for friends, so strangers are found without it
const STRANGER_FIELDS = "firstName lastName username avatar cover coverStyle activityStatus createdAt";

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

const PERSON_PROJECTION = Object.fromEntries(STRANGER_FIELDS.split(" ").map((field) => [field, 1]));

// the closest matches first whoever they are: the exact username, then names and usernames that start with the words, then last names that do, then the rest
const closenessTo = (keyword) => {
  const startsWith = new RegExp(`^${escapeRegex(keyword)}`, "i");
  const username = normalizeUsername(keyword);
  return {
    $switch: {
      branches: [
        { case: { $eq: ["$username", username] }, then: 0 },
        { case: { $regexMatch: { input: { $concat: ["$firstName", " ", "$lastName"] }, regex: startsWith } }, then: 1 },
        { case: { $regexMatch: { input: { $ifNull: ["$username", ""] }, regex: new RegExp(`^${escapeRegex(username)}`) } }, then: 1 },
        { case: { $regexMatch: { input: "$lastName", regex: startsWith } }, then: 2 },
      ],
      default: 3,
    },
  };
};

// friends and everyone else in one list, with no presence, since a friend's shows from the friends list already
export const searchEveryone = async (user, keyword, page) => {
  const filter = { ...nameOrUsernameFilter(keyword), _id: { $ne: user._id }, verified: true };

  const [users, totalCount] = await Promise.all([
    UserModel.aggregate([
      { $match: filter },
      { $addFields: { closeness: closenessTo(keyword) } },
      { $sort: { closeness: 1, firstName: 1, lastName: 1, _id: 1 } },
      { $skip: skipFor(page, PEOPLE_PAGE_SIZE) },
      { $limit: PEOPLE_PAGE_SIZE },
      { $project: PERSON_PROJECTION },
    ]),
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
