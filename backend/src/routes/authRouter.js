import express from "express";
import trimRequest from "trim-request";
import {
  register,
  sendOtp,
  verifyOTP,
  getChallenge,
  renewAccessToken,
  login,
  logout,
  forgotPassword,
  resetPassword,
} from "#src/controllers/authController.js";
import {
  githubAuth,
  googleAuth,
  linkedinAuth,
} from "#src/controllers/socialController.js";
import { getLoginOptions, passkeyLogin } from "#src/controllers/passkeyController.js";
import { protect } from "#src/middlewares/authMiddleware.js";
import { requireRecaptcha } from "#src/middlewares/recaptchaMiddleware.js";
import { requireSessionKey } from "#src/middlewares/sessionKeyMiddleware.js";
import { codeLimit, emailLimit, loginLimit, sessionLimit, signupLimit, socialLimit } from "#src/middlewares/rateLimiters.js";

const authRouter = express.Router();

// Login Route
authRouter.route("/login").post(trimRequest.all, loginLimit(), requireSessionKey, requireRecaptcha, login);

// Logout Route
authRouter.route("/logout").post(sessionLimit(), protect, logout);

// Register Route
authRouter.route("/register").post(trimRequest.all, signupLimit(), requireRecaptcha, register);

// Send OTP Route
authRouter.route("/send-otp").post(trimRequest.all, emailLimit(), sendOtp);

// Verify OTP Route
authRouter.route("/verify-otp").post(trimRequest.all, codeLimit(), requireSessionKey, requireRecaptcha, verifyOTP);

// Forgot Password Route
authRouter.route("/forgot-password").post(trimRequest.all, emailLimit(), requireRecaptcha, forgotPassword);

// Reset Password Route
authRouter.route("/reset-password").post(trimRequest.all, codeLimit(), resetPassword);

// Session Renewal Routes
authRouter.route("/session/challenge").post(sessionLimit(), getChallenge);

authRouter.route("/session/token").post(sessionLimit(), renewAccessToken);

// ------------- Passkey Auth -------------

authRouter.route("/passkeys/options").post(sessionLimit(), getLoginOptions);

authRouter.route("/passkeys/login").post(sessionLimit(), requireSessionKey, passkeyLogin);

// ------------- Social Auth -------------

// Google Auth Route
authRouter.route("/google").post(socialLimit(), requireSessionKey, googleAuth);

// GitHub Auth Route
authRouter.route("/github").post(socialLimit(), requireSessionKey, githubAuth);

// LinkedIn Auth Route
authRouter.route("/linkedin").post(socialLimit(), requireSessionKey, linkedinAuth);

export default authRouter;
