import { announceRequests } from "#src/controllers/friendsController.js";
import { blockUser, listBlocked, unblockUser } from "#src/services/blockService.js";
import { fileReport } from "#src/services/reportService.js";

export const getBlocked = async (req, res) => {
  res.status(200).json({ status: "success", blocked: await listBlocked(req.user._id) });
};

// a blocked friend sees this one go offline, as they will not hear about them again
export const block = async (req, res) => {
  const blocked = await blockUser(req.user, req.params.user_id);
  announceRequests(req, req.user._id, "ended");
  announceRequests(req, blocked._id, "ended");
  const { _id, firstName, lastName, avatar } = req.user;
  if (req.user.friends.some((friendId) => friendId.equals(blocked._id))) {
    req.app.get("io").to(String(blocked._id)).emit("online_friends", { _id, firstName, lastName, avatar, onlineStatus: "offline" });
  }
  res.status(200).json({ status: "success", blocked });
};

export const unblock = async (req, res) => {
  await unblockUser(req.user, req.params.user_id);
  res.status(200).json({ status: "success" });
};

export const report = async (req, res) => {
  await fileReport(req.user, req.body);
  res.status(200).json({ status: "success", message: "Thanks, your report was sent" });
};
