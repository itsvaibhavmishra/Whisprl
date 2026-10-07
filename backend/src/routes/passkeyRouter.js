import express from "express";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import { addPasskey, deletePasskey, getPasskeys, getRegistrationOptions } from "#src/controllers/passkeyController.js";

const passkeyRouter = express.Router();

passkeyRouter.route("/").get(protect, readLimit(), getPasskeys).post(protect, writeLimit(), addPasskey);

passkeyRouter.route("/options").post(protect, writeLimit(), getRegistrationOptions);

passkeyRouter.route("/:passkey_id").delete(protect, writeLimit(), deletePasskey);

export default passkeyRouter;
