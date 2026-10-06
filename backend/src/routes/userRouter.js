import express from "express";
import trimRequest from "trim-request";
import multer from "multer";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit, searchLimit, uploadLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import {
  checkUsernameAvailable,
  getMyProfile,
  getUserData,
  searchUsers,
  updatePassword,
  updateProfile,
  updateQuickReactions,
  updateUsername,
} from "#src/controllers/userController.js";

const userRouter = express.Router();

// multer setup
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024, files: 2 } });
const profileImages = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "cover", maxCount: 1 },
]);

// Update Profile Route
userRouter
  .route("/update-profile")
  .post(protect, uploadLimit(), profileImages, trimRequest.all, updateProfile);

// Change Password Route
userRouter.route("/change-password").post(trimRequest.all, protect, writeLimit(), updatePassword);

// Username Routes
userRouter.route("/username").get(protect, readLimit(), checkUsernameAvailable).put(protect, writeLimit(), updateUsername);

// Quick Reactions Route
userRouter.route("/quick-reactions").put(protect, writeLimit(), updateQuickReactions);

// Own Profile Route
userRouter.route("/me").get(protect, readLimit(), getMyProfile);

// Search Users Route
userRouter.route("/search").get(trimRequest.all, protect, searchLimit(), searchUsers);

// Get User Data Route
userRouter.route("/getUserData").get(trimRequest.all, protect, readLimit(), getUserData);

export default userRouter;
