import express from "express";

import { arrange, claim, getMyBadges } from "#src/controllers/badgeController.js";
import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit, writeLimit } from "#src/middlewares/rateLimiters.js";

const badgeRouter = express.Router();

badgeRouter.route("/mine").get(protect, readLimit(), getMyBadges);

badgeRouter.route("/claim").put(protect, writeLimit(), claim);

badgeRouter.route("/arrangement").put(protect, writeLimit(), arrange);

export default badgeRouter;
