import createHttpError from "http-errors";

import {
  answerFriendRequest,
  cancelFriendRequest,
  listFriends,
  listOnlineFriends,
  listReceivedRequests,
  listSentRequests,
  sendFriendRequest,
  unfriend,
} from "#src/services/friendsService.js";
import { presenceAudienceOf } from "#src/services/blockService.js";
import { searchFriendsOf } from "#src/services/userService.js";
import { assertText } from "#src/utils/accountRules.js";

const summaryOf = ({ _id, firstName, lastName }) => ({ _id, firstName, lastName });

// every tab of each person whose requests changed refetches them, so their badge and list follow along
export const announceRequests = (req, ...user_ids) => req.app.get("io").to(user_ids.map(String)).emit("friend_requests_changed");

// -------------------------- Send Request --------------------------
export const sendRequest = async (req, res, next) => {
  try {
    const receiver = await sendFriendRequest(req.user, req.body.receiver_id);
    announceRequests(req, receiver._id);

    res.status(200).json({
      status: "success",
      message: "Friend request sent successfully",
      sender: summaryOf(req.user),
      receiver: summaryOf(receiver),
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------- Cancel Request -----------------------
export const cancelRequest = async (req, res, next) => {
  try {
    const { receiver_id } = req.body;
    await cancelFriendRequest(req.user._id, receiver_id);
    announceRequests(req, receiver_id);

    res.status(200).json({ status: "info", message: "Friend request canceled", receiver_id });
  } catch (error) {
    next(error);
  }
};

// ----------------------- Accept/Reject Request -----------------------
export const acceptRejectRequest = async (req, res, next) => {
  try {
    const { sender_id } = req.body;
    const action = String(req.body.action_type ?? "").toLowerCase();
    await answerFriendRequest(req.user._id, sender_id, action);
    announceRequests(req, req.user._id);

    res.status(200).json(
      action === "accept"
        ? { status: "success", message: "Friend request accepted", sender_id }
        : { status: "info", message: "Friend request rejected", sender_id }
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

// ----------------------- Get Friend Requests -----------------------
export const getRequests = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", friendRequests: await listReceivedRequests(req.user._id) });
  } catch (error) {
    next(error);
  }
};

// ----------------------- Get Sent Requests -----------------------
export const getSentRequests = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", sentRequests: await listSentRequests(req.user._id) });
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
