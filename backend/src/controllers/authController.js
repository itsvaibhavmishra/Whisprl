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
} from "../services/authService.js";
import {
  endSession,
  issueAccessToken,
  refreshSession,
  signOutEverywhere,
  signOutSession,
  startSession,
} from "../services/sessionService.js";

export const respondWithSession = async (req, res, user, message) => {
  const accessToken = await startSession(user, req, res);
  res.status(200).json({ status: "success", message, user: toSessionUser(user), accessToken });
};

// -------------------------- Login auth --------------------------
export const login = async (req, res, next) => {
  try {
    const user = await loginWithPassword(req.body.email, req.body.password);

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
    const session = await endSession(req, res);
    if (session) await signOutSession(req.app.get("io"), session);

    res.status(200).json({ status: "success", message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Refresh Token --------------------------
export const refreshToken = async (req, res, next) => {
  try {
    const session = await refreshSession(req, res);
    const user = await findSessionUser(session.user);

    res.status(200).json({
      status: "success",
      message: "Token Refreshed",
      user: toSessionUser(user),
      accessToken: issueAccessToken(user._id, session._id),
    });
  } catch (error) {
    next(error);
  }
};
