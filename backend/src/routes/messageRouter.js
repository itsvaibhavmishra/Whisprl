import express from "express";
import trimRequest from "trim-request";
import multer from "multer";

import { protect } from "../middlewares/authMiddleware.js";
import { readLimit, uploadLimit, writeLimit } from "../middlewares/rateLimiters.js";
import {
  attachFile,
  getDeliverableMessages,
  getMessages,
  removeAttachment,
  resealWaitingMessage,
} from "../controllers/messageController.js";
import { MAX_SEALED_FILE_SIZE } from "../services/messageService.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_SEALED_FILE_SIZE, files: 1 } });
const messageRouter = express.Router();

// Get Message Route
messageRouter
  .route("/get-messages/:convo_id")
  .get(trimRequest.all, protect, readLimit(), getMessages);

// Waiting Messages Routes
messageRouter.route("/deliverable").get(protect, readLimit(), getDeliverableMessages);

messageRouter.route("/:message_id/reseal").patch(protect, writeLimit(), resealWaitingMessage);

// Encrypted Attachment Routes
messageRouter.route("/:message_id/attachment").post(protect, uploadLimit(), upload.single("file"), attachFile);

messageRouter.route("/:message_id").delete(protect, writeLimit(), removeAttachment);

export default messageRouter;
