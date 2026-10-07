import express from "express";
import multer from "multer";
import trimRequest from "trim-request";

import { protect } from "#src/middlewares/authMiddleware.js";
import { uploadLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import {
  addGroupMembers,
  createNewGroup,
  dropAdmin,
  makeAdmin,
  removeGroupMember,
  updateGroup,
} from "#src/controllers/groupController.js";

const upload = multer({ limits: { fileSize: 3 * 1024 * 1024, files: 1 } });
const groupRouter = express.Router();

groupRouter.route("/").post(trimRequest.all, protect, writeLimit(), createNewGroup);

groupRouter.route("/:group_id").patch(protect, uploadLimit(), upload.single("picture"), trimRequest.all, updateGroup);

groupRouter.route("/:group_id/members").post(protect, writeLimit(), addGroupMembers);

groupRouter.route("/:group_id/members/:user_id").delete(protect, writeLimit(), removeGroupMember);

groupRouter.route("/:group_id/admins/:user_id").put(protect, writeLimit(), makeAdmin).delete(protect, writeLimit(), dropAdmin);

export default groupRouter;
