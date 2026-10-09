import createHttpError from "http-errors";
import validator from "validator";

import {
  changePassword,
  getOwnProfile,
  getPublicProfile,
  saveProfile,
  searchEveryone,
  searchForUsers,
  setQuickReactions,
  setShowBirthdayToFriends,
} from "#src/services/userService.js";
import { endOtherSessions, signOutOtherDevices } from "#src/services/sessionService.js";
import { setSuggestToFriendsOfFriends } from "#src/services/suggestionService.js";
import { changeUsername, checkUsername } from "#src/services/usernameService.js";
import { assertText, assertValidName, oldEnoughBirthdayFrom } from "#src/utils/accountRules.js";
import { assertCoverStyle } from "#src/utils/coverStyles.js";

// -------------------------- Update Profile --------------------------
export const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, activityStatus = "", coverPattern, coverPalette, birthday } = req.body;
    const user = req.user;

    if (!firstName || !lastName) {
      throw createHttpError.BadRequest("Required fields: firstName, lastName");
    }

    assertValidName(firstName, lastName);
    assertText(activityStatus);

    if (!validator.isLength(activityStatus, { max: 50 })) {
      throw createHttpError.BadRequest("Keep your bio under 50 characters");
    }

    // a birthday can be changed but never removed, so an empty one leaves it as it was
    const fields = { firstName, lastName, activityStatus, ...(birthday && { birthday: oldEnoughBirthdayFrom(birthday) }) };
    if (coverPattern || coverPalette) {
      assertCoverStyle(coverPattern, coverPalette);
      fields.coverStyle = { pattern: coverPattern, palette: coverPalette };
    }

    const uploads = { avatar: req.files?.avatar?.[0], cover: req.files?.cover?.[0] };
    const removals = { avatar: req.body.removeAvatar === "true", cover: req.body.removeCover === "true" };
    await saveProfile(user, fields, uploads, removals);

    return res.status(200).json({
      status: "success",
      message: "Profile saved",
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        cover: user.cover,
        coverStyle: user.coverStyle,
        activityStatus: user.activityStatus,
        birthday: user.birthday ?? null,
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

// -------------------------- Suggestions --------------------------
export const updateSuggestionSetting = async (req, res, next) => {
  try {
    const suggestToFriendsOfFriends = await setSuggestToFriendsOfFriends(req.user, req.body.suggestToFriendsOfFriends);
    return res.status(200).json({ status: "success", suggestToFriendsOfFriends });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Birthday --------------------------
export const updateBirthdaySetting = async (req, res, next) => {
  try {
    const showBirthdayToFriends = await setShowBirthdayToFriends(req.user, req.body.showBirthdayToFriends);
    return res.status(200).json({ status: "success", showBirthdayToFriends });
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

// -------------------------- Find People --------------------------
export const findPeople = async (req, res, next) => {
  try {
    const keyword = req.query.search;
    if (!keyword) throw createHttpError.BadRequest("Query required");
    assertText(keyword);

    const { users, totalCount } = await searchEveryone(req.user, keyword, req.query.page);

    res.status(200).json({ status: "success", usersFound: totalCount, users });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Get User Data --------------------------
export const getUserData = async (req, res, next) => {
  try {
    const userData = await getPublicProfile(req.user, req.query);

    res.status(200).json({ status: "success", userData });
  } catch (error) {
    next(error);
  }
};
