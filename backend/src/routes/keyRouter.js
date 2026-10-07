import express from "express";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import { addKey, getKeys, getPasskeyKeys, linkPasskey, updateBackup } from "#src/controllers/keyController.js";

const keyRouter = express.Router();

keyRouter.route("/").get(protect, readLimit(), getKeys).post(protect, writeLimit(), addKey);

keyRouter.route("/backup").put(protect, writeLimit(), updateBackup);

keyRouter.route("/passkeys").get(protect, readLimit(), getPasskeyKeys);

keyRouter.route("/passkeys/:credential_id").put(protect, writeLimit(), linkPasskey);

export default keyRouter;
