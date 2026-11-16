import { platformOf } from "#src/services/activityService.js";
import { arrangeBadges, claimBadges, offeredBadgesOf, ownBadgesOf } from "#src/services/badgeService.js";

export const getMyBadges = async (req, res) => {
  const [held, offered] = await Promise.all([ownBadgesOf(req.user._id), offeredBadgesOf(req.user._id, platformOf(req))]);
  res.status(200).json({ status: "success", held, offered });
};

export const claim = async (req, res) => {
  await claimBadges(req.user._id, req.body.badgeIds, platformOf(req));
  res.status(200).json({ status: "success" });
};

export const arrange = async (req, res) => {
  await arrangeBadges(req.user._id, req.body);
  res.status(200).json({ status: "success" });
};
