import createHttpError from "http-errors";
import validator from "validator";

import { generateLoginTokens } from "../services/authService.js";
import {
  changePassword,
  getOwnProfile,
  PUBLIC_PROFILE_FIELDS,
  saveProfile,
  searchForUsers,
} from "../services/userService.js";
import { UserModel } from "../models/index.js";

// -------------------------- Update Profile --------------------------
export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, activityStatus } = req.body;
    const user = req.user;

    if (!firstName || !lastName || !activityStatus) {
      throw createHttpError.BadRequest(
        "Required fields: firstName, lastName, activityStatus"
      );
    }

    if (
      !validator.isLength(firstName, { min: 3, max: 16 }) ||
      !validator.isLength(lastName, { min: 3, max: 16 })
    ) {
      throw createHttpError.BadRequest(
        "First and last name must each be 3 to 16 characters long"
      );
    }

    if (!validator.isAlpha(firstName) || !validator.isAlpha(lastName)) {
      throw createHttpError.BadRequest(
        "First and last name can only contain letters"
      );
    }

    if (!validator.isLength(activityStatus, { min: 3, max: 50 })) {
      throw createHttpError.BadRequest(
        "Status must be 3 to 50 characters long"
      );
    }

    const uploads = { avatar: req.files?.avatar?.[0], cover: req.files?.cover?.[0] };
    const removals = { avatar: req.body.removeAvatar === "true", cover: req.body.removeCover === "true" };
    await saveProfile(user, { firstName, lastName, activityStatus }, uploads, removals);

    return res.status(200).json({
      status: "success",
      message: "Profile saved",
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        cover: user.cover,
        activityStatus: user.activityStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Own Profile --------------------------
export const getMyProfile = async (req, res, next) => {
  try {
    const user = await getOwnProfile(req.user);
    return res.status(200).json({ status: "success", user });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Change Password --------------------------
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw createHttpError.BadRequest(
        "Required fields: currentPassword, newPassword"
      );
    }

    await changePassword(req.user, currentPassword, newPassword);

    // Changing the password expires every older token, this session's included.
    const token = await generateLoginTokens(req.user, res);

    return res.status(200).json({
      status: "success",
      message: "Password changed",
      token,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Search Users --------------------------
export const searchUsers = async (req, res, next) => {
  try {
    const keyword = req.query.search;
    const page = req.query.page || "0";

    const currentUser_id = req.user?._id;
    const friends_ids = req.user?.friends;

    // check for required fields
    if (!keyword) {
      throw createHttpError.BadRequest("Query required");
    }

    // get list of users matching keyword
    const { users, totalCount } = await searchForUsers(
      keyword,
      page,
      friends_ids,
      currentUser_id
    );

    res.status(200).json({
      status: "success",
      usersFound: totalCount,
      users: users,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Get User Data --------------------------
export const getUserData = async (req, res, next) => {
  try {
    const id = req.query.userId;

    // check for required fields
    if (!id) {
      throw createHttpError.BadRequest("Query required");
    }

    const userData = await UserModel.findById(id).select(PUBLIC_PROFILE_FIELDS);

    res.status(200).json({
      status: "success",
      userData: userData,
    });
  } catch (error) {
    next(error);
  }
};
