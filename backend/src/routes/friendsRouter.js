import express from "express";
import trimRequest from "trim-request";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit, requestLimit, searchLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import {
  acceptRejectRequest,
  cancelRequest,
  getFriends,
  getNoteTarget,
  getOnlineFriends,
  getRequests,
  removeFriend,
  searchFriends,
  sendRequest,
} from "#src/controllers/friendsController.js";

const friendsRouter = express.Router();

// Send Friend Request
friendsRouter
  .route("/send-request")
  .post(trimRequest.all, protect, requestLimit(), sendRequest);

// The chat a request's note is sealed for
friendsRouter.route("/note-target/:user_id").get(trimRequest.all, protect, readLimit(), getNoteTarget);

// Cancel Friend Request
friendsRouter
  .route("/cancel-request")
  .post(trimRequest.all, protect, writeLimit(), cancelRequest);

// Accept/Reject Friend Request
friendsRouter
  .route("/accept-reject-request")
  .post(trimRequest.all, protect, writeLimit(), acceptRejectRequest);

// Remove Friend
friendsRouter
  .route("/remove-friend")
  .post(trimRequest.all, protect, writeLimit(), removeFriend);

// Get List of Friends
friendsRouter.route("/get-friends").get(trimRequest.all, protect, readLimit(), getFriends);

// Get List of Online Friends
friendsRouter
  .route("/online-friends")
  .get(trimRequest.all, protect, readLimit(), getOnlineFriends);

// Search for Friends
friendsRouter.route("/search").get(trimRequest.all, protect, searchLimit(), searchFriends);

// Received and sent requests, with the cooldowns still running
friendsRouter.route("/requests").get(trimRequest.all, protect, readLimit(), getRequests);

export default friendsRouter;
