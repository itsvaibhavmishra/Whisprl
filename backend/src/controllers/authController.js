import {
  findSessionUser,
  loginWithPassword,
  registerUser,
  resendVerificationCode,
  resetPasswordWithToken,
  sendPasswordReset,
  sendVerificationCode,
  toSessionUser,
  verifyEmail,
} from "#src/services/authService.js";
import { endSession, issueAccessToken, issueChallenge, renewSession, signOutEverywhere, signOutSession, startSession } from "#src/services/sessionService.js";
import { platformOf } from "#src/services/activityService.js";
import { noteLoginDevice, noteRenewingDevice } from "#src/services/deviceService.js";
import { settleOnboarding } from "#src/services/onboardingService.js";
import { assertNotShutOut } from "#src/services/moderationService.js";
import { settleDeletionAtLogin } from "#src/services/accountDeletionService.js";
import { assertNotWhisprl } from "#src/services/whisprlService.js";

export const respondWithSession = async (req, res, user, message, extra = {}) => {
  assertNotShutOut(user);
  assertNotWhisprl(user._id, "Nobody signs in to Whisprl's own account");
  const welcomeBack = await settleDeletionAtLogin(req.app.get("io"), user);
  await settleOnboarding(user);
  const session = await startSession(user, req.body.sessionKey, req);
  noteLoginDevice(user, req.body.deviceId, req);
  res.status(200).json({ status: "success", message: welcomeBack ?? message, user: await toSessionUser(user), ...session, ...extra });
};

export const login = async (req, res) => {
  const user = await loginWithPassword(req.body.identifier, req.body.password);

  if (!user.verified) {
    return res.status(200).json({ status: "info", message: `Hello ${user.firstName}, please verify to login` });
  }

  await respondWithSession(req, res, user, "Logged in successfully");
};

export const register = async (req, res) => {
  const user = await registerUser(req.body);
  await sendVerificationCode(user);

  res.status(200).json({ status: "success", message: "We emailed you a code" });
};

export const sendOtp = async (req, res) => {
  await resendVerificationCode(req.body.email);

  res.status(200).json({ status: "success", message: "We emailed you a code" });
};

export const verifyOTP = async (req, res) => {
  const user = await verifyEmail(req.body.email, req.body.otp);

  await respondWithSession(req, res, user, "Email verified");
};

export const forgotPassword = async (req, res) => {
  await sendPasswordReset(req.body.email);

  res.status(200).json({ status: "success", message: "Reset Password link sent" });
};

export const resetPassword = async (req, res) => {
  const user = await resetPasswordWithToken(req.body);
  signOutEverywhere(req.app.get("io"), user._id);

  res.status(200).json({ status: "success", message: "Password Reset Successfully" });
};

export const logout = async (req, res) => {
  const session = await endSession(req.sessionId);
  if (session) await signOutSession(req.app.get("io"), session);

  res.status(200).json({ status: "success", message: "Logged out successfully" });
};

export const getChallenge = (req, res) => {
  res.status(200).json({ status: "success", challenge: issueChallenge() });
};

export const renewAccessToken = async (req, res) => {
  const session = await renewSession(req.body, platformOf(req));
  const user = await findSessionUser(session.user);
  noteRenewingDevice(user._id, req.body.deviceId);

  res.status(200).json({ status: "success", user: await toSessionUser(user), ...issueAccessToken(user._id, session._id) });
};
