import express from "express";
import trimRequest from "trim-request";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import {
  createOpenConversation,
  getCommonGroups,
  getConversations,
  pin,
  unpin,
} from "#src/controllers/conversationController.js";
import { clearConversation, updateChatPreferences, updateDisappearing } from "#src/controllers/chatSettingsController.js";

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

// Chat Settings Routes
conversationRouter.route("/:convo_id/preferences").patch(protect, writeLimit(), updateChatPreferences);

conversationRouter.route("/:convo_id/clear").post(protect, writeLimit(), clearConversation);

conversationRouter.route("/:convo_id/disappearing").put(protect, writeLimit(), updateDisappearing);

export default conversationRouter;
