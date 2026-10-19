import express from "express";

import { forgetDevice, saveDevice } from "#src/controllers/pushController.js";
import { protect } from "#src/middlewares/authMiddleware.js";
import { writeLimit } from "#src/middlewares/rateLimiters.js";

const pushRouter = express.Router();

pushRouter.route("/device").put(protect, writeLimit(), saveDevice).delete(protect, writeLimit(), forgetDevice);

export default pushRouter;
