import express from "express";
import trimRequest from "trim-request";
import multer from "multer";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit, searchLimit, uploadLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import {
  checkUsernameAvailable,
  findPeople,
  getMyProfile,
  getUserData,
  searchUsers,
  updateBirthdaySetting,
  updatePassword,
  updateProfile,
  updateQuickReactions,
  updateSuggestionSetting,
  updateUsername,
} from "#src/controllers/userController.js";
import { block, getBlocked, report, unblock } from "#src/controllers/safetyController.js";

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

// Block and Report Routes
userRouter.route("/blocked").get(protect, readLimit(), getBlocked);

userRouter.route("/blocked/:user_id").put(protect, writeLimit(), block).delete(protect, writeLimit(), unblock);

userRouter.route("/report").post(protect, writeLimit(), report);

// Quick Reactions Route
userRouter.route("/quick-reactions").put(protect, writeLimit(), updateQuickReactions);

// Whether friends of friends see this person in their suggestions
userRouter.route("/suggestions").put(protect, writeLimit(), updateSuggestionSetting);

// Whether friends see this person's birthday
userRouter.route("/birthday-visibility").put(protect, writeLimit(), updateBirthdaySetting);

// Own Profile Route
userRouter.route("/me").get(protect, readLimit(), getMyProfile);

// Search Users Route
userRouter.route("/search").get(trimRequest.all, protect, searchLimit(), searchUsers);

// Everyone, friends included, closest matches first
userRouter.route("/people").get(trimRequest.all, protect, searchLimit(), findPeople);

// Get User Data Route
userRouter.route("/getUserData").get(trimRequest.all, protect, readLimit(), getUserData);

export default userRouter;
