import express from "express";
import trimRequest from "trim-request";

import { protect } from "../middlewares/authMiddleware.js";
import { readLimit, writeLimit } from "../middlewares/rateLimiters.js";
import {
  createOpenConversation,
  getConversations,
} from "../controllers/conversationController.js";

const conversationRouter = express.Router();

// Create New Conversation Route
conversationRouter
  .route("/create-open-conversation")
  .post(trimRequest.all, protect, writeLimit(), createOpenConversation);

conversationRouter
  .route("/get-conversations")
  .get(trimRequest.all, protect, readLimit(), getConversations);

export default conversationRouter;
