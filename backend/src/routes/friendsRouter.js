import express from "express";

import { protect } from "#src/middlewares/authMiddleware.js";
import { readLimit, requestLimit, searchLimit, writeLimit } from "#src/middlewares/rateLimiters.js";
import {
  acceptRejectRequest,
  cancelRequest,
  getFriends,
  getNoteTarget,
  getOnlineFriends,
  getRequests,
  getSuggestions,
  hideSuggestion,
  removeFriend,
  searchFriends,
  seeRequests,
  sendRequest,
} from "#src/controllers/friendsController.js";

const friendsRouter = express.Router();

friendsRouter
  .route("/send-request")
  .post(protect, requestLimit(), sendRequest);

// The chat a request's note is sealed for
friendsRouter.route("/note-target/:user_id").get(protect, readLimit(), getNoteTarget);

friendsRouter
  .route("/cancel-request")
  .post(protect, writeLimit(), cancelRequest);

friendsRouter
  .route("/accept-reject-request")
  .post(protect, writeLimit(), acceptRejectRequest);

friendsRouter
  .route("/remove-friend")
  .post(protect, writeLimit(), removeFriend);

friendsRouter.route("/get-friends").get(protect, readLimit(), getFriends);

friendsRouter
  .route("/online-friends")
  .get(protect, readLimit(), getOnlineFriends);

friendsRouter.route("/search").get(protect, searchLimit(), searchFriends);

// Received and sent requests, with the cooldowns still running
friendsRouter.route("/requests").get(protect, readLimit(), getRequests);

// Opening the list clears the count of requests not looked at yet
friendsRouter.route("/requests/seen").put(protect, writeLimit(), seeRequests);

// People you may know, and hiding one of them
friendsRouter.route("/suggestions").get(protect, readLimit(), getSuggestions);
friendsRouter.route("/suggestions/:user_id").delete(protect, writeLimit(), hideSuggestion);

export default friendsRouter;
