import express from "express";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit } from "#src/middlewares/rateLimiters.js";
import { getUpdatePolicy } from "#src/controllers/appController.js";

const appRouter = express.Router();

appRouter.route("/update-policy").get(protect, readLimit(), getUpdatePolicy);

export default appRouter;
