import { announceRequests } from "#src/controllers/friendsController.js";
import { blockUser, listBlocked, unblockUser } from "#src/services/blockService.js";
import { fileReport } from "#src/services/reportService.js";

// -------------------------- Block --------------------------
export const getBlocked = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", blocked: await listBlocked(req.user._id) });
  } catch (error) {
    next(error);
  }
};

// a blocked friend sees this one go offline, as they will not hear about them again
export const block = async (req, res, next) => {
  try {
    const blocked = await blockUser(req.user, req.params.user_id);
    announceRequests(req, req.user._id, blocked._id);
    const { _id, firstName, lastName, avatar } = req.user;
    if (req.user.friends.some((friendId) => friendId.equals(blocked._id))) {
      req.app.get("io").to(String(blocked._id)).emit("online_friends", { _id, firstName, lastName, avatar, onlineStatus: "offline" });
    }
    res.status(200).json({ status: "success", blocked });
  } catch (error) {
    next(error);
  }
};

export const unblock = async (req, res, next) => {
  try {
    await unblockUser(req.user, req.params.user_id);
    res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Report --------------------------
export const report = async (req, res, next) => {
  try {
    await fileReport(req.user, req.body);
    res.status(200).json({ status: "success", message: "Thanks, your report was sent" });
  } catch (error) {
    next(error);
  }
};
