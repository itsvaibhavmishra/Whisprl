import express from "express";
import trimRequest from "trim-request";

import { protect } from "../middlewares/authMiddleware.js";
import { readLimit, writeLimit } from "../middlewares/rateLimiters.js";
import {
  createOpenConversation,
  getCommonGroups,
  getConversations,
  pin,
  unpin,
} from "../controllers/conversationController.js";

const conversationRouter = express.Router();

// Create New Conversation Route
conversationRouter
  .route("/create-open-conversation")
  .post(trimRequest.all, protect, writeLimit(), createOpenConversation);

conversationRouter
  .route("/get-conversations")
  .get(trimRequest.all, protect, readLimit(), getConversations);

conversationRouter.route("/common-groups/:user_id").get(protect, readLimit(), getCommonGroups);

conversationRouter.route("/:convo_id/pins/:message_id").put(protect, writeLimit(), pin).delete(protect, writeLimit(), unpin);

export default conversationRouter;
