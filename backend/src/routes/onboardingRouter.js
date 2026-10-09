import express from "express";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import { confirmUsername, getOnboarding, saveBirthday, saveRecoveryKey, seeWhatsNew, skip } from "#src/controllers/onboardingController.js";

const onboardingRouter = express.Router();

onboardingRouter.route("/").get(protect, readLimit(), getOnboarding);

onboardingRouter.route("/birthday").put(protect, writeLimit(), saveBirthday);

onboardingRouter.route("/username").put(protect, writeLimit(), confirmUsername);

onboardingRouter.route("/recovery-key").put(protect, writeLimit(), saveRecoveryKey);

onboardingRouter.route("/whats-new").put(protect, writeLimit(), seeWhatsNew);

onboardingRouter.route("/:step/skip").put(protect, writeLimit(), skip);

export default onboardingRouter;
