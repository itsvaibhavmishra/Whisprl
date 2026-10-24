import { toSessionUser } from "#src/services/authService.js";
import {
  allowNotificationsStep,
  confirmUsernameStep,
  saveBirthdayStep,
  saveRecoveryKeyStep,
  settleOnboarding,
  skipStep,
} from "#src/services/onboardingService.js";

const respondWithUser = async (res, user) => res.status(200).json({ status: "success", user: await toSessionUser(user) });

// a step finished elsewhere, like a photo saved on the profile, is noticed here
export const getOnboarding = async (req, res) => {
  await settleOnboarding(req.user);
  return respondWithUser(res, req.user);
};

export const saveBirthday = async (req, res) => {
  return respondWithUser(res, await saveBirthdayStep(req.user, req.body));
};

export const confirmUsername = async (req, res) => {
  return respondWithUser(res, await confirmUsernameStep(req.user));
};

export const saveRecoveryKey = async (req, res) => {
  return respondWithUser(res, await saveRecoveryKeyStep(req.user));
};

export const allowNotifications = async (req, res) => {
  return respondWithUser(res, await allowNotificationsStep(req.user));
};

export const skip = async (req, res) => {
  return respondWithUser(res, await skipStep(req.user, req.params.step));
};
