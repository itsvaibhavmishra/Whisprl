import express from "express";

import { protect } from "#src/middlewares/authMiddleware.js";
import { gameRequestLimit, readLimit } from "#src/middlewares/rateLimiters.js";
import { getLeaderboard, getOngoingGame, sendGameRequest } from "#src/controllers/gameController.js";

const gameRouter = express.Router();

gameRouter.route("/requests").post(protect, gameRequestLimit(), sendGameRequest);

gameRouter.route("/ongoing").get(protect, readLimit(), getOngoingGame);

gameRouter.route("/:conversation_id/leaderboard").get(protect, readLimit(), getLeaderboard);

export default gameRouter;
