import createHttpError from "http-errors";
import validator from "validator";

import {
  changePassword,
  getOwnProfile,
  getPublicProfile,
  saveProfile,
  searchEveryone,
  searchForUsers,
  setGameAudio,
  setQuickReactions,
  setShowBirthdayToFriends,
} from "#src/services/userService.js";
import { endOtherSessions, signOutOtherDevices } from "#src/services/sessionService.js";
import { scheduleDeletion, sendDeletionCode } from "#src/services/accountDeletionService.js";
import { setSuggestToFriendsOfFriends } from "#src/services/suggestionService.js";
import { changeUsername, checkUsername } from "#src/services/usernameService.js";
import { assertText, assertValidName, oldEnoughBirthdayFrom, trimmed } from "#src/utils/accountRules.js";
import { assertCoverStyle } from "#src/utils/coverStyles.js";

export const updateProfile = async (req, res) => {
  const { coverPattern, coverPalette } = req.body;
  const [firstName, lastName, activityStatus = "", birthday] = [req.body.firstName, req.body.lastName, req.body.activityStatus, req.body.birthday].map(trimmed);
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
};

export const getMyProfile = async (req, res) => {
  const user = await getOwnProfile(req.user);
  return res.status(200).json({ status: "success", user });
};

export const checkUsernameAvailable = async (req, res) => {
  assertText(req.query.username);
  const { username, problem } = await checkUsername(req.user, req.query.username);
  res.status(200).json({ status: "success", username, problem });
};

export const updateUsername = async (req, res) => {
  assertText(req.body.username);
  const { username, usernameChangedAt } = await changeUsername(req.user, req.body.username);
  res.status(200).json({ status: "success", username, usernameChangedAt });
};

export const updateGameAudio = async (req, res) => {
  const gameAudio = await setGameAudio(req.user, req.params.game_id, req.body);
  return res.status(200).json({ status: "success", gameAudio });
};

export const updateQuickReactions = async (req, res) => {
  const quickReactions = await setQuickReactions(req.user, req.body.reactions);
  return res.status(200).json({ status: "success", quickReactions });
};

export const updateSuggestionSetting = async (req, res) => {
  const suggestToFriendsOfFriends = await setSuggestToFriendsOfFriends(req.user, req.body.suggestToFriendsOfFriends);
  return res.status(200).json({ status: "success", suggestToFriendsOfFriends });
};

export const updateBirthdaySetting = async (req, res) => {
  const showBirthdayToFriends = await setShowBirthdayToFriends(req.user, req.body.showBirthdayToFriends);
  return res.status(200).json({ status: "success", showBirthdayToFriends });
};

export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw createHttpError.BadRequest("Required fields: currentPassword, newPassword");
  }

  await changePassword(req.user._id, currentPassword, newPassword);

  await endOtherSessions(req.user._id, req.sessionId);
  await signOutOtherDevices(req.app.get("io"), req.user._id, req.sessionId);

  return res.status(200).json({ status: "success", message: "Password changed" });
};

export const searchUsers = async (req, res) => {
  const keyword = trimmed(req.query.search);
  if (!keyword) throw createHttpError.BadRequest("Query required");
  assertText(keyword);

  const { users, totalCount } = await searchForUsers(keyword, req.query.page, req.user);

  res.status(200).json({ status: "success", usersFound: totalCount, users });
};

export const findPeople = async (req, res) => {
  const keyword = trimmed(req.query.search);
  if (!keyword) throw createHttpError.BadRequest("Query required");
  assertText(keyword);

  const { users, totalCount } = await searchEveryone(req.user, keyword, req.query.page);

  res.status(200).json({ status: "success", usersFound: totalCount, users });
};

export const getUserData = async (req, res) => {
  const userData = await getPublicProfile(req.user, req.query);

  res.status(200).json({ status: "success", userData });
};

export const sendAccountDeletionCode = async (req, res) => {
  await sendDeletionCode(req.user);

  res.status(200).json({ status: "success", message: `We emailed a code to ${req.user.email}` });
};

export const requestAccountDeletion = async (req, res) => {
  const { dueAt, day } = await scheduleDeletion(req.app.get("io"), req.user, req.body);

  res.status(200).json({ status: "success", message: `Your account will be deleted on ${day}. Log in before then to keep it.`, dueAt });
};
