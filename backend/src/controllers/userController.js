import createHttpError from "http-errors";
import validator from "validator";

import {
  changePassword,
  getOwnProfile,
  getPublicProfile,
  saveProfile,
  searchForUsers,
  setQuickReactions,
} from "#src/services/userService.js";
import { endOtherSessions, signOutOtherDevices } from "#src/services/sessionService.js";
import { changeUsername, checkUsername } from "#src/services/usernameService.js";
import { assertText, assertValidName } from "#src/utils/accountRules.js";

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

    assertValidName(firstName, lastName);
    assertText(activityStatus);

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

// -------------------------- Username --------------------------
export const checkUsernameAvailable = async (req, res, next) => {
  try {
    assertText(req.query.username);
    const { username, problem } = await checkUsername(req.user, req.query.username);
    res.status(200).json({ status: "success", username, problem });
  } catch (error) {
    next(error);
  }
};

export const updateUsername = async (req, res, next) => {
  try {
    assertText(req.body.username);
    const { username, usernameChangedAt } = await changeUsername(req.user, req.body.username);
    res.status(200).json({ status: "success", username, usernameChangedAt });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Quick Reactions --------------------------
export const updateQuickReactions = async (req, res, next) => {
  try {
    const quickReactions = await setQuickReactions(req.user, req.body.reactions);
    return res.status(200).json({ status: "success", quickReactions });
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

    await changePassword(req.user._id, currentPassword, newPassword);

    await endOtherSessions(req.user._id, req.sessionId);
    await signOutOtherDevices(req.app.get("io"), req.user._id, req.sessionId);

    return res.status(200).json({ status: "success", message: "Password changed" });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Search Users --------------------------
export const searchUsers = async (req, res, next) => {
  try {
    const keyword = req.query.search;
    if (!keyword) throw createHttpError.BadRequest("Query required");
    assertText(keyword);

    const { users, totalCount } = await searchForUsers(keyword, req.query.page, req.user);

    res.status(200).json({ status: "success", usersFound: totalCount, users });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Get User Data --------------------------
export const getUserData = async (req, res, next) => {
  try {
    const userData = await getPublicProfile(req.query.userId);

    res.status(200).json({ status: "success", userData });
  } catch (error) {
    next(error);
  }
};
