import express from "express";
import multer from "multer";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit, uploadLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import { attachFile, getDeliverableMessages, getMessages, resealWaitingMessage } from "#src/controllers/messageController.js";
import { edit, open, react, reactToAlbum, removeForEveryone, removeForMe, unreact, unreactToAlbum } from "#src/controllers/messageActionController.js";
import { MAX_SEALED_FILE_SIZE } from "#src/services/messageService.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_SEALED_FILE_SIZE, files: 1 } });
const messageRouter = express.Router();

messageRouter.route("/get-messages/:convo_id").get(protect, readLimit(), getMessages);

messageRouter.route("/deliverable").get(protect, readLimit(), getDeliverableMessages);

messageRouter.route("/:message_id/reseal").patch(protect, writeLimit(), resealWaitingMessage);

messageRouter.route("/:message_id/attachment").post(protect, uploadLimit(), upload.single("file"), attachFile);

messageRouter.route("/:message_id").patch(protect, writeLimit(), edit).delete(protect, writeLimit(), removeForEveryone);

messageRouter.route("/:message_id/hide").post(protect, writeLimit(), removeForMe);

messageRouter.route("/:message_id/open").post(protect, writeLimit(), open);

messageRouter.route("/:message_id/reaction").put(protect, writeLimit(), react).delete(protect, writeLimit(), unreact);

messageRouter.route("/:message_id/album-reaction").put(protect, writeLimit(), reactToAlbum).delete(protect, writeLimit(), unreactToAlbum);

export default messageRouter;
