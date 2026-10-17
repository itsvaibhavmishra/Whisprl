import express from "express";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit } from "#src/middlewares/rateLimiters.js";
import { getLeaderboard } from "#src/controllers/gameController.js";

const gameRouter = express.Router();

gameRouter.route("/:conversation_id/leaderboard").get(protect, readLimit(), getLeaderboard);

export default gameRouter;
