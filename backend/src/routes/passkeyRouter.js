import express from "express";

import { protect } from "../middlewares/authMiddleware.js";
import { readLimit, writeLimit } from "../middlewares/rateLimiters.js";
import { addPasskey, deletePasskey, getPasskeys, getRegistrationOptions } from "../controllers/passkeyController.js";

const passkeyRouter = express.Router();

passkeyRouter.route("/").get(protect, readLimit(), getPasskeys).post(protect, writeLimit(), addPasskey);

passkeyRouter.route("/options").post(protect, writeLimit(), getRegistrationOptions);

passkeyRouter.route("/:passkey_id").delete(protect, writeLimit(), deletePasskey);

export default passkeyRouter;
