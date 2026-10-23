import express from "express";
import multer from "multer";

import { protect } from "#src/middlewares/authMiddleware.js";
import { codeLimit, readLimit, searchLimit, uploadLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import {
  checkUsernameAvailable,
  findPeople,
  getMyProfile,
  updateGameAudio,
  getUserData,
  requestAccountDeletion,
  searchUsers,
  sendAccountDeletionCode,
  updateBirthdaySetting,
  updatePassword,
  updateProfile,
  updateQuickReactions,
  updateSuggestionSetting,
  updateUsername,
} from "#src/controllers/userController.js";
import { block, getBlocked, report, unblock } from "#src/controllers/safetyController.js";

const userRouter = express.Router();

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024, files: 2 } });
const profileImages = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "cover", maxCount: 1 },
]);

userRouter
  .route("/update-profile")
  .post(protect, uploadLimit(), profileImages, updateProfile);

userRouter.route("/change-password").post(protect, writeLimit(), updatePassword);

userRouter.route("/username").get(protect, readLimit(), checkUsernameAvailable).put(protect, writeLimit(), updateUsername);

userRouter.route("/blocked").get(protect, readLimit(), getBlocked);

userRouter.route("/blocked/:user_id").put(protect, writeLimit(), block).delete(protect, writeLimit(), unblock);

userRouter.route("/report").post(protect, writeLimit(), report);

userRouter.route("/quick-reactions").put(protect, writeLimit(), updateQuickReactions);

userRouter.route("/game-audio/:game_id").put(protect, writeLimit(), updateGameAudio);

// Whether friends of friends see this person in their suggestions
userRouter.route("/suggestions").put(protect, writeLimit(), updateSuggestionSetting);

// Whether friends see this person's birthday
userRouter.route("/birthday-visibility").put(protect, writeLimit(), updateBirthdaySetting);

// Delete Account Routes: a code goes to the account's email, and the deletion waits 14 days for a login to cancel it
userRouter.route("/deletion/code").post(protect, writeLimit(), sendAccountDeletionCode);

userRouter.route("/deletion").post(protect, codeLimit(), requestAccountDeletion);

userRouter.route("/me").get(protect, readLimit(), getMyProfile);

userRouter.route("/search").get(protect, searchLimit(), searchUsers);

// Everyone, friends included, closest matches first
userRouter.route("/people").get(protect, searchLimit(), findPeople);

userRouter.route("/getUserData").get(protect, readLimit(), getUserData);

export default userRouter;
