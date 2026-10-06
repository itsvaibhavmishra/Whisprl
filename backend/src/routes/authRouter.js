import express from "express";
import trimRequest from "trim-request";
import {
  register,
  sendOtp,
  verifyOTP,
  refreshToken,
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
import { requireRecaptcha } from "#src/middlewares/recaptchaMiddleware.js";
import { codeLimit, emailLimit, loginLimit, sessionLimit, signupLimit, socialLimit } from "#src/middlewares/rateLimiters.js";

const authRouter = express.Router();

// Login Route
authRouter.route("/login").post(trimRequest.all, loginLimit(), requireRecaptcha, login);

// Logout Route
authRouter.route("/logout").post(sessionLimit(), logout);

// Register Route
authRouter.route("/register").post(trimRequest.all, signupLimit(), requireRecaptcha, register);

// Send OTP Route
authRouter.route("/send-otp").post(trimRequest.all, emailLimit(), sendOtp);

// Verify OTP Route
authRouter.route("/verify-otp").post(trimRequest.all, codeLimit(), requireRecaptcha, verifyOTP);

// Forgot Password Route
authRouter.route("/forgot-password").post(trimRequest.all, emailLimit(), requireRecaptcha, forgotPassword);

// Reset Password Route
authRouter.route("/reset-password").post(trimRequest.all, codeLimit(), resetPassword);

// Refresh Token Route
authRouter.route("/refresh-token").post(sessionLimit(), refreshToken);

// ------------- Passkey Auth -------------

authRouter.route("/passkeys/options").post(sessionLimit(), getLoginOptions);

authRouter.route("/passkeys/login").post(sessionLimit(), passkeyLogin);

// ------------- Social Auth -------------

// Google Auth Route
authRouter.route("/google").post(socialLimit(), googleAuth);

// GitHub Auth Route
authRouter.route("/github").post(socialLimit(), githubAuth);

// LinkedIn Auth Route
authRouter.route("/linkedin").post(socialLimit(), linkedinAuth);

export default authRouter;
