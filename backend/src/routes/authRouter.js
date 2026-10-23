import express from "express";
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

authRouter.route("/login").post(loginLimit(), requireSessionKey, requireRecaptcha, login);

authRouter.route("/logout").post(sessionLimit(), protect, logout);

authRouter.route("/register").post(signupLimit(), requireRecaptcha, register);

authRouter.route("/send-otp").post(emailLimit(), sendOtp);

authRouter.route("/verify-otp").post(codeLimit(), requireSessionKey, requireRecaptcha, verifyOTP);

authRouter.route("/forgot-password").post(emailLimit(), requireRecaptcha, forgotPassword);

authRouter.route("/reset-password").post(codeLimit(), resetPassword);

authRouter.route("/session/challenge").post(sessionLimit(), getChallenge);

authRouter.route("/session/token").post(sessionLimit(), renewAccessToken);

authRouter.route("/passkeys/options").post(sessionLimit(), getLoginOptions);

authRouter.route("/passkeys/login").post(sessionLimit(), requireSessionKey, passkeyLogin);

authRouter.route("/google").post(socialLimit(), requireSessionKey, googleAuth);

authRouter.route("/github").post(socialLimit(), requireSessionKey, githubAuth);

authRouter.route("/linkedin").post(socialLimit(), requireSessionKey, linkedinAuth);

export default authRouter;
