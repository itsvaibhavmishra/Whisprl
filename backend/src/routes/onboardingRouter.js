import express from "express";
import multer from "multer";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit, uploadLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import { getOnboarding, saveBirthday, saveProfile, saveRecoveryKey } from "#src/controllers/onboardingController.js";

const onboardingRouter = express.Router();

const photo = multer({ limits: { fileSize: 3 * 1024 * 1024, files: 1 } }).single("photo");

onboardingRouter.route("/").get(protect, readLimit(), getOnboarding);

onboardingRouter.route("/birthday").put(protect, writeLimit(), saveBirthday);

onboardingRouter.route("/profile").put(protect, uploadLimit(), photo, saveProfile);

onboardingRouter.route("/recovery-key").put(protect, writeLimit(), saveRecoveryKey);

export default onboardingRouter;
