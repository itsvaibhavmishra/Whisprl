import { toSessionUser } from "#src/services/authService.js";
import { saveBirthdayStep, saveProfileStep, saveRecoveryKeyStep, settleOnboarding } from "#src/services/onboardingService.js";

const respondWithUser = async (res, user) => res.status(200).json({ status: "success", user: await toSessionUser(user) });

export const getOnboarding = async (req, res) => {
  await settleOnboarding(req.user);
  return respondWithUser(res, req.user);
};

export const saveBirthday = async (req, res) => {
  return respondWithUser(res, await saveBirthdayStep(req.user, req.body));
};

export const saveProfile = async (req, res) => {
  return respondWithUser(res, await saveProfileStep(req.user, req.body, req.file));
};

export const saveRecoveryKey = async (req, res) => {
  return respondWithUser(res, await saveRecoveryKeyStep(req.user));
};
