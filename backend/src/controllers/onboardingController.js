import { toSessionUser } from "#src/services/authService.js";
import { confirmUsernameStep, markWhatsNewSeen, saveBirthdayStep, saveRecoveryKeyStep, settleOnboarding, skipStep } from "#src/services/onboardingService.js";

const respondWithUser = async (res, user) => res.status(200).json({ status: "success", user: await toSessionUser(user) });

// -------------------------- Progress --------------------------
// a step finished elsewhere, like a photo saved on the profile, is noticed here
export const getOnboarding = async (req, res, next) => {
  try {
    await settleOnboarding(req.user);
    return await respondWithUser(res, req.user);
  } catch (error) {
    next(error);
  }
};

// -------------------------- Birthday --------------------------
export const saveBirthday = async (req, res, next) => {
  try {
    return await respondWithUser(res, await saveBirthdayStep(req.user, req.body));
  } catch (error) {
    next(error);
  }
};

// -------------------------- Username --------------------------
export const confirmUsername = async (req, res, next) => {
  try {
    return await respondWithUser(res, await confirmUsernameStep(req.user));
  } catch (error) {
    next(error);
  }
};

// -------------------------- Recovery key --------------------------
export const saveRecoveryKey = async (req, res, next) => {
  try {
    return await respondWithUser(res, await saveRecoveryKeyStep(req.user));
  } catch (error) {
    next(error);
  }
};

// -------------------------- What's new --------------------------
export const seeWhatsNew = async (req, res, next) => {
  try {
    return await respondWithUser(res, await markWhatsNewSeen(req.user, req.body.version));
  } catch (error) {
    next(error);
  }
};

// -------------------------- Skip --------------------------
export const skip = async (req, res, next) => {
  try {
    return await respondWithUser(res, await skipStep(req.user, req.params.step));
  } catch (error) {
    next(error);
  }
};
