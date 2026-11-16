import express from "express";

import { join, reachStep, read, visit } from "#src/controllers/promotionController.js";
import { protect } from "#src/middlewares/authMiddleware.js";
import { inviteLimit, writeLimit } from "#src/middlewares/rateLimiters.js";

const promotionRouter = express.Router();

// opened before signing in, so these two are public and limited by address like an invite
promotionRouter.route("/:code").get(inviteLimit(), read);
promotionRouter.route("/:code/visits").post(inviteLimit(), visit);

promotionRouter.route("/:code/join").post(protect, writeLimit(), join);
promotionRouter.route("/:code/steps/:step").put(protect, writeLimit(), reachStep);

export default promotionRouter;
