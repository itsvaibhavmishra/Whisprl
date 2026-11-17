import express from "express";
import { getChallenge, renewAccessToken, login, logout } from "#src/controllers/authController.js";
import { googleAuth } from "#src/controllers/socialController.js";
import { protect } from "#src/middlewares/authMiddleware.js";
import { requireSessionKey } from "#src/middlewares/sessionKeyMiddleware.js";
import { loginLimit, sessionLimit, socialLimit } from "#src/middlewares/rateLimiters.js";

const authRouter = express.Router();

authRouter.route("/login").post(loginLimit(), requireSessionKey, login);

authRouter.route("/logout").post(sessionLimit(), protect, logout);

authRouter.route("/session/challenge").post(sessionLimit(), getChallenge);

authRouter.route("/session/token").post(sessionLimit(), renewAccessToken);

authRouter.route("/google").post(socialLimit(), requireSessionKey, googleAuth);

export default authRouter;
