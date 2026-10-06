import express from "express";
import trimRequest from "trim-request";

import { protect } from "../middlewares/authMiddleware.js";
import { readLimit, searchLimit, writeLimit } from "../middlewares/rateLimiters.js";
import {
  acceptRejectRequest,
  cancelRequest,
  getFriends,
  getOnlineFriends,
  getRequests,
  getSentRequests,
  removeFriend,
  searchFriends,
  sendRequest,
} from "../controllers/friendsController.js";

const friendsRouter = express.Router();

// Send Friend Request
friendsRouter
  .route("/send-request")
  .post(trimRequest.all, protect, writeLimit(), sendRequest);

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

// Get List of Friend Requests
friendsRouter.route("/get-requests").get(trimRequest.all, protect, readLimit(), getRequests);

// Get List of Sent Requests
friendsRouter
  .route("/get-sent-requests")
  .get(trimRequest.all, protect, readLimit(), getSentRequests);

export default friendsRouter;
