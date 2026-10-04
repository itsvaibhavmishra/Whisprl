import express from "express";
import trimRequest from "trim-request";
import multer from "multer";

import { protect } from "../middlewares/authMiddleware.js";
import { getMessages, sendMessage } from "../controllers/messageController.js";

const upload = multer({ storage: multer.memoryStorage() });
const messageRouter = express.Router();

// Send Message Route
messageRouter
  .route("/send-message")
  .post(upload.single("file"), trimRequest.all, protect, sendMessage);

// Get Message Route
messageRouter
  .route("/get-messages/:convo_id")
  .get(trimRequest.all, protect, getMessages);

export default messageRouter;
