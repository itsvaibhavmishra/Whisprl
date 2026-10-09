import createHttpError from "http-errors";

import {
  answerFriendRequest,
  cancelFriendRequest,
  listFriends,
  listOnlineFriends,
  listRequests,
  noteTargetFor,
  sendFriendRequest,
  unfriend,
} from "#src/services/friendsService.js";
import { presenceAudienceOf } from "#src/services/blockService.js";
import { dismissSuggestion, suggestionsFor } from "#src/services/suggestionService.js";
import { searchFriendsOf } from "#src/services/userService.js";
import { assertText } from "#src/utils/accountRules.js";

const summaryOf = ({ _id, firstName, lastName, avatar }) => ({ _id, firstName, lastName, avatar });

export const announceRequests = (req, user_id, kind, details = {}) =>
  req.app.get("io").to(String(user_id)).emit("friend_requests_changed", { kind, ...details });

// -------------------------- Send Request --------------------------
export const sendRequest = async (req, res, next) => {
  try {
    const receiver = await sendFriendRequest(req.user, req.body.receiver_id, req.body.note);
    announceRequests(req, req.user._id, "sent");
    announceRequests(req, receiver._id, "received", { person: summaryOf(req.user) });

    res.status(200).json({ status: "success", message: "Friend request sent", receiver: summaryOf(receiver) });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Note Target --------------------------
export const getNoteTarget = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", ...(await noteTargetFor(req.user, req.params.user_id)) });
  } catch (error) {
    next(error);
  }
};

// ----------------------- Cancel Request -----------------------
export const cancelRequest = async (req, res, next) => {
  try {
    const { receiver_id } = req.body;
    await cancelFriendRequest(req.user._id, receiver_id);
    announceRequests(req, req.user._id, "withdrawn");
    announceRequests(req, receiver_id, "withdrawn");

    res.status(200).json({ status: "info", message: "Friend request canceled", receiver_id });
  } catch (error) {
    next(error);
  }
};

// ----------------------- Accept/Reject Request -----------------------
// a decline reaches the sender as a plain "ended", the same word a block sends, so it is never named
export const acceptRejectRequest = async (req, res, next) => {
  try {
    const { sender_id } = req.body;
    const action = String(req.body.action_type ?? "").toLowerCase();
    const conversation = await answerFriendRequest(req.user, sender_id, action);
    const conversationId = conversation?._id;

    if (action === "accept") {
      if (conversationId) req.app.get("io").in([String(sender_id), String(req.user._id)]).socketsJoin(String(conversationId));
      announceRequests(req, sender_id, "accepted", { person: summaryOf(req.user), conversationId });
      announceRequests(req, req.user._id, "answered", { conversationId });
    } else {
      announceRequests(req, sender_id, "ended");
      announceRequests(req, req.user._id, "declined");
    }

    res.status(200).json(
      action === "accept"
        ? { status: "success", message: "Friend request accepted", sender_id, conversationId }
        : { status: "info", message: "Friend request declined", sender_id }
    );
  } catch (error) {
    next(error);
  }
};

// ----------------------- Remove Friend -----------------------
export const removeFriend = async (req, res, next) => {
  try {
    const { friend_id } = req.body;
    await unfriend(req.user, friend_id);
    req.app.get("io").to([String(req.user._id), String(friend_id)]).emit("friends_changed");

    res.status(200).json({ status: "success", message: "Friend removed successfully", friend_id });
  } catch (error) {
    next(error);
  }
};

// ----------------------- Get Friends List -----------------------
export const getFriends = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", friends: await listFriends(req.user) });
  } catch (error) {
    next(error);
  }
};

// ----------------------- Get Online Friends List -----------------------
export const getOnlineFriends = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", onlineFriends: await listOnlineFriends(req.user) });
  } catch (error) {
    next(error);
  }
};

// ----------------------- Search Friends -----------------------
export const searchFriends = async (req, res, next) => {
  try {
    const keyword = req.query.search;
    if (!keyword) throw createHttpError.BadRequest("Query required");
    assertText(keyword);

    const { friends, totalCount } = await searchFriendsOf(req.user, keyword, req.query.page);

    res.status(200).json({ status: "success", usersFound: totalCount, friends });
  } catch (error) {
    next(error);
  }
};

// ----------------------- Get Requests -----------------------
export const getRequests = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", ...(await listRequests(req.user._id)) });
  } catch (error) {
    next(error);
  }
};

// ----------------------- Suggestions -----------------------
export const getSuggestions = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", suggestions: await suggestionsFor(req.user) });
  } catch (error) {
    next(error);
  }
};

export const hideSuggestion = async (req, res, next) => {
  try {
    await dismissSuggestion(req.user, req.params.user_id);
    res.status(200).json({ status: "success", user_id: req.params.user_id });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------------------------

// ----------------------- Socket: Friend Status -----------------------
export const emitFriendStatus = async (io, user, onlineStatus) => {
  const { _id, firstName, lastName, avatar } = user;
  io.to(await presenceAudienceOf(user)).emit("online_friends", { _id, firstName, lastName, avatar, onlineStatus });
};
