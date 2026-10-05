import express from "express";
import trimRequest from "trim-request";
import multer from "multer";

import { protect } from "../middlewares/authMiddleware.js";
import {
  getDeliverableMessages,
  getMessages,
  resealWaitingMessage,
  sendMessage,
} from "../controllers/messageController.js";
import { MAX_FILE_SIZE } from "../services/messageService.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE, files: 1 } });
const messageRouter = express.Router();

// Send Message Route
messageRouter
  .route("/send-message")
  .post(protect, upload.single("file"), trimRequest.all, sendMessage);

// Get Message Route
messageRouter
  .route("/get-messages/:convo_id")
  .get(trimRequest.all, protect, getMessages);

// Waiting Messages Routes
messageRouter.route("/deliverable").get(protect, getDeliverableMessages);

messageRouter.route("/:message_id/reseal").patch(protect, resealWaitingMessage);

export default messageRouter;
