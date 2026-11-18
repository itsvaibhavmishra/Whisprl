import createHttpError from "http-errors";

import { markReached } from "#src/services/journeyService.js";
import { saveProfile, validateProfileImage } from "#src/services/userService.js";
import { changeUsername } from "#src/services/usernameService.js";
import { birthdayFrom, genderFrom, isOldEnough, nameFrom } from "#src/utils/accountRules.js";
import { presetAvatarOf } from "#src/utils/avatarPresets.js";

const AGE_PAUSE_MS = 24 * 60 * 60 * 1000;

const STEPS = [
  { id: "birthday", isDone: (user) => Boolean(user.birthday) },
  { id: "profile", isDone: (user) => Boolean(user.gender && user.usernameConfirmedAt) },
  { id: "messages", isDone: (user) => Boolean(user.recoveryKeySavedAt) },
];

const isPaused = (user) => user.agePausedUntil > new Date();

export const hasPassedAgeCheck = (user) => Boolean(user.birthday) && !isPaused(user);

export const onboardingOf = (user) => ({
  isNewAccount: Boolean(user.isNewAccount),
  pausedUntil: isPaused(user) ? user.agePausedUntil : null,
  steps: STEPS.map((step) => ({ id: step.id, isDone: step.isDone(user) })),
});

// an account stops being new the first time it has nothing left to set up
export const settleOnboarding = async (user) => {
  if (!user.isNewAccount) return;
  const { steps } = onboardingOf(user);
  if (steps.some((step) => !step.isDone)) return;
  user.isNewAccount = false;
  await user.save();
};

export const saveBirthdayStep = async (user, { birthday }) => {
  if (isPaused(user)) throw createHttpError.Forbidden("Whisprl isn't available to you based on the details you entered");
  const born = birthdayFrom(birthday);
  if (!born) throw createHttpError.BadRequest("Birthday required");

  // too young pauses the account without saying why, so trying an older year has to wait a day
  if (isOldEnough(born)) {
    user.birthday = born;
    markReached(user, "birthday");
  } else {
    user.agePausedUntil = new Date(Date.now() + AGE_PAUSE_MS);
  }
  await user.save();
  await settleOnboarding(user);
  return user;
};

// with neither a preset nor an upload, the photo from sign in stays
export const saveProfileStep = async (user, { name, username, gender, preset }, photo) => {
  if (photo) validateProfileImage("avatar", photo);
  const fields = {
    name: nameFrom(name),
    gender: user.gender ?? genderFrom(gender),
    usernameConfirmedAt: new Date(),
    ...(preset && { avatar: presetAvatarOf(preset) }),
  };
  await changeUsername(user, username);
  await saveProfile(user, fields, { avatar: photo }, {});
  markReached(user, "username");
  await settleOnboarding(user);
  return user;
};

export const saveRecoveryKeyStep = async (user) => {
  if (!user.publicKeys.length) throw createHttpError.BadRequest("Make your recovery key first");
  user.recoveryKeySavedAt = new Date();
  markReached(user, "recoveryKey");
  await user.save();
  await settleOnboarding(user);
  return user;
};
