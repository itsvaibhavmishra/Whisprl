import { inviteCodeOf, inviterOf } from "#src/services/inviteService.js";

export const getMyInviteCode = async (req, res) => {
  res.status(200).json({ status: "success", code: await inviteCodeOf(req.user._id) });
};

export const getInviter = async (req, res) => {
  res.status(200).json({ status: "success", inviter: await inviterOf(req.params.code) });
};
