import createHttpError from "http-errors";
import sizeOf from "image-size";
import validator from "validator";

import { ConversationModel, FriendRequestModel, MessageModel, UserModel } from "../models/index.js";
import { deleteFile, isCloudinaryFile, uploadFiles } from "./fileUploadService.js";

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

export const PUBLIC_PROFILE_FIELDS = "firstName lastName avatar cover email activityStatus createdAt";

const validateProfileImage = (kind, file) => {
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

const uploadProfileImage = async (user, kind, file) => {
  const { fileUrls } = await uploadFiles(
    PROFILE_IMAGES[kind].folder,
    { ...file, originalname: `${kind}-${Date.now()}` },
    user._id.toString()
  );
  return fileUrls[0];
};

// Checks every upload before touching Cloudinary, and deletes replaced images only once the user is saved.
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

export const changePassword = async (user, currentPassword, newPassword) => {
  if (!(await user.correctPassword(currentPassword, user.password))) {
    throw createHttpError.BadRequest("Your current password is incorrect");
  }
  if (!validator.isStrongPassword(newPassword)) {
    throw createHttpError.BadRequest(
      "Password must be at least 8 characters long, with a number, a lowercase letter, an uppercase letter and a symbol"
    );
  }
  user.password = newPassword;
  await user.save();
};

// search users
export const searchForUsers = async (
  keyword,
  page,
  friends_ids,
  currentUser_id
) => {
  const pageSize = 10; // maximum users to display at once
  let users = [];
  let totalCount = 0;

  // Build the search criteria
  const searchCriteria = {};

  if (validator.isEmail(keyword)) {
    // If the keyword is an email address, search by email
    searchCriteria.email = keyword;
  } else {
    // If the keyword is not an email, search by combined firstName and lastName
    const combinedNameRegex = new RegExp(keyword, "i"); // 'i' for case-insensitive
    searchCriteria.$or = [
      { firstName: combinedNameRegex },
      { lastName: combinedNameRegex },
      {
        $expr: {
          $regexMatch: {
            input: { $concat: ["$firstName", " ", "$lastName"] },
            regex: combinedNameRegex,
          },
        },
      },
    ];
  }

  // Exclude friends of the current user
  searchCriteria._id = { $nin: friends_ids };

  // Perform the search including requestSent field
  users = await UserModel.aggregate([
    { $match: searchCriteria },
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        avatar: 1,
        activityStatus: 1,
        onlineStatus: 1,
        // Check if a friend request has been sent to this user
        requestSent: {
          $cond: {
            if: {
              $in: ["$_id", friends_ids],
            },
            then: false, // If user is already a friend, requestSent is false
            else: {
              $in: [
                "$_id",
                await FriendRequestModel.find({
                  sender: currentUser_id,
                }).distinct("recipient"),
              ],
            },
          },
        },
      },
    },
  ]);

  // Get the total count for pagination
  totalCount = users.length;

  // Paginate the results
  users = users.slice(page * pageSize, (page + 1) * pageSize);

  return { users, totalCount };
};
