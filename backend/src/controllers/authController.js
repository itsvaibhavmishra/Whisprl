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
import {
  endSession,
  issueAccessToken,
  issueChallenge,
  renewSession,
  signOutEverywhere,
  signOutSession,
  startSession,
} from "#src/services/sessionService.js";

export const respondWithSession = async (req, res, user, message, extra = {}) => {
  const session = await startSession(user, req.body.sessionKey, req);
  res.status(200).json({ status: "success", message, user: toSessionUser(user), ...session, ...extra });
};

// -------------------------- Login auth --------------------------
export const login = async (req, res, next) => {
  try {
    // a page loaded before usernames could log in still sends the email under its old name
    const user = await loginWithPassword(req.body.identifier ?? req.body.email, req.body.password);

    if (!user.verified) {
      return res.status(200).json({ status: "info", message: `Hello ${user.firstName}, please verify to login` });
    }

    await respondWithSession(req, res, user, "Logged in successfully");
  } catch (error) {
    next(error);
  }
};

// -------------------------- Register auth --------------------------
export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    await sendVerificationCode(user);

    res.status(200).json({ status: "success", message: "OTP Sent" });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Sending OTP --------------------------
export const sendOtp = async (req, res, next) => {
  try {
    await resendVerificationCode(req.body.email);

    res.status(200).json({ status: "success", message: "OTP Sent" });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Verifying OTP --------------------------
export const verifyOTP = async (req, res, next) => {
  try {
    const user = await verifyEmail(req.body.email, req.body.otp);

    await respondWithSession(req, res, user, "OTP verified");
  } catch (error) {
    next(error);
  }
};

// -------------------------- Forgot Password --------------------------
export const forgotPassword = async (req, res, next) => {
  try {
    await sendPasswordReset(req.body.email);

    res.status(200).json({ status: "success", message: "Reset Password link sent" });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Reset Password --------------------------
export const resetPassword = async (req, res, next) => {
  try {
    const user = await resetPasswordWithToken(req.body);
    signOutEverywhere(req.app.get("io"), user._id);

    res.status(200).json({ status: "success", message: "Password Reset Successfully" });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Logout auth --------------------------
export const logout = async (req, res, next) => {
  try {
    const session = await endSession(req.sessionId);
    if (session) await signOutSession(req.app.get("io"), session);

    res.status(200).json({ status: "success", message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Renew Access Token --------------------------
export const getChallenge = (req, res) => {
  res.status(200).json({ status: "success", challenge: issueChallenge() });
};

export const renewAccessToken = async (req, res, next) => {
  try {
    const session = await renewSession(req.body);
    const user = await findSessionUser(session.user);

    res.status(200).json({ status: "success", user: toSessionUser(user), ...issueAccessToken(user._id, session._id) });
  } catch (error) {
    next(error);
  }
};
