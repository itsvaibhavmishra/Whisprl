import express from "express";

import { getInviter, getMyInviteCode, joinWithInvite } from "#src/controllers/inviteController.js";
import { protect } from "#src/middlewares/authMiddleware.js";
import { inviteLimit, readLimit, writeLimit } from "#src/middlewares/rateLimiters.js";

const inviteRouter = express.Router();

inviteRouter.route("/mine").get(protect, readLimit(), getMyInviteCode);

// open to anyone holding the link, which is the only way to learn a code
inviteRouter.route("/:code").get(inviteLimit(), getInviter);

inviteRouter.route("/:code/join").post(protect, writeLimit(), joinWithInvite);

export default inviteRouter;
