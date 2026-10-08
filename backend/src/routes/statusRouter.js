import express from "express";
import multer from "multer";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit, uploadLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import {
  createStatus,
  deleteStatus,
  getHiddenFrom,
  getSealedFor,
  getStatuses,
  reactStatus,
  updateHiddenFrom,
  viewStatus,
} from "#src/controllers/statusController.js";
import { MAX_SEALED_FILE_SIZE } from "#src/services/messageService.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_SEALED_FILE_SIZE, files: 1 } });
const statusRouter = express.Router();

statusRouter.route("/").get(protect, readLimit(), getStatuses).post(protect, uploadLimit(), upload.single("file"), createStatus);

statusRouter.route("/sealed-for").get(protect, readLimit(), getSealedFor).post(protect, readLimit(), getSealedFor);

statusRouter.route("/hidden-from").get(protect, readLimit(), getHiddenFrom).put(protect, writeLimit(), updateHiddenFrom);

statusRouter.route("/:status_id").delete(protect, writeLimit(), deleteStatus);

statusRouter.route("/:status_id/view").post(protect, writeLimit(), viewStatus);

statusRouter.route("/:status_id/react").post(protect, writeLimit(), reactStatus);

export default statusRouter;
