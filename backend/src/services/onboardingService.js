import createHttpError from "http-errors";

import { markReached } from "#src/services/journeyService.js";
import { birthdayFrom, isOldEnough } from "#src/utils/accountRules.js";

const AGE_PAUSE_MS = 24 * 60 * 60 * 1000;

// setup asks only the required steps, an optional one is offered later where it fits, and raising its version offers it again
const STEPS = [
  { id: "birthday", isRequired: true, isDone: (user) => Boolean(user.birthday) },
  { id: "username", isRequired: true, isDone: (user) => Boolean(user.usernameConfirmedAt || user.usernameChangedAt) },
  { id: "messages", isRequired: true, isDone: (user) => Boolean(user.recoveryKeySavedAt) },
  { id: "profile", isRequired: false, version: 1, isForNewAccounts: true, isDone: (user) => Boolean(user.avatar) },
];

const isPaused = (user) => user.agePausedUntil > new Date();

const isSkipped = (step, user) => !step.isRequired && (user.skippedSteps?.get(step.id)?.version ?? 0) >= step.version;

const statusOf = (step, user) => {
  if (step.isDone(user)) return "done";
  return isSkipped(step, user) ? "skipped" : "none";
};

export const onboardingOf = (user) => ({
  isNewAccount: Boolean(user.isNewAccount),
  pausedUntil: isPaused(user) ? user.agePausedUntil : null,
  steps: STEPS.filter((step) => !step.isForNewAccounts || user.isNewAccount).map((step) => ({
    id: step.id,
    isRequired: step.isRequired,
    status: statusOf(step, user),
  })),
});

// an account stops being new the first time it has nothing left to set up
export const settleOnboarding = async (user) => {
  if (!user.isNewAccount) return;
  const { steps } = onboardingOf(user);
  if (steps.some((step) => step.status === "none")) return;
  user.isNewAccount = false;
  await user.save();
};

export const saveBirthdayStep = async (user, { birthday, showBirthdayToFriends, suggestToFriendsOfFriends }) => {
  if (isPaused(user)) throw createHttpError.Forbidden("Whisprl isn't available to you based on the details you entered");
  if (![showBirthdayToFriends, suggestToFriendsOfFriends].every((choice) => typeof choice === "boolean")) {
    throw createHttpError.BadRequest("Choose on or off");
  }
  const born = birthdayFrom(birthday);
  if (!born) throw createHttpError.BadRequest("Birthday required");

  // too young pauses the account without saying why, so trying an older year has to wait a day
  if (isOldEnough(born)) {
    user.set({ birthday: born, showBirthdayToFriends, suggestToFriendsOfFriends });
    markReached(user, "birthday");
  } else {
    user.agePausedUntil = new Date(Date.now() + AGE_PAUSE_MS);
  }
  await user.save();
  await settleOnboarding(user);
  return user;
};

export const confirmUsernameStep = async (user) => {
  user.usernameConfirmedAt = new Date();
  markReached(user, "username");
  await user.save();
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

export const skipStep = async (user, stepId) => {
  const step = STEPS.find(({ id }) => id === stepId);
  if (!step) throw createHttpError.NotFound("No such step");
  if (step.isRequired) throw createHttpError.BadRequest("This step can't be skipped");
  user.skippedSteps ??= new Map();
  user.skippedSteps.set(step.id, { version: step.version, at: new Date() });
  await user.save();
  await settleOnboarding(user);
  return user;
};
