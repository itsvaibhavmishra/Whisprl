import express from "express";
import trimRequest from "trim-request";
import multer from "multer";

import { protect } from "../middlewares/authMiddleware.js";
import {
  getMyProfile,
  getUserData,
  searchUsers,
  updatePassword,
  updateProfile,
} from "../controllers/userController.js";

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
  .post(trimRequest.all, protect, profileImages, updateProfile);

// Change Password Route
userRouter.route("/change-password").post(trimRequest.all, protect, updatePassword);

// Own Profile Route
userRouter.route("/me").get(protect, getMyProfile);

// Search Users Route
userRouter.route("/search").get(trimRequest.all, protect, searchUsers);

// Get User Data Route
userRouter.route("/getUserData").get(trimRequest.all, protect, getUserData);

export default userRouter;
