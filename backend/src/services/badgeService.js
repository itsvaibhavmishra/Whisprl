import mongoose from "mongoose";

import { BadgeHolderModel, BadgeModel } from "#src/models/index.js";

let catalog = new Map();

// admin edits badges on its own, so the list is read again on every sweep and a change shows within a minute
export const refreshBadges = async () => {
  const badges = await BadgeModel.find().select("name description source claimableOn levels retiredAt").lean();
  catalog = new Map(
    badges.map((badge) => [
      String(badge._id),
      {
        id: String(badge._id),
        name: badge.name,
        description: badge.description,
        needsClaim: badge.source === "given",
        isRetired: Boolean(badge.retiredAt),
        claimableOn: badge.claimableOn ?? "anywhere",
        levelArts: badge.levels.map((level) => level.art?.url).filter(Boolean),
      },
    ])
  );
};

// one badge as a person sees it before holding it, for a link that offers it
export const badgeOf = (badgeId) => {
  const badge = catalog.get(String(badgeId));
  return (
    badge && {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      art: badge.levelArts[0],
      isRetired: badge.isRetired,
    }
  );
};

const stillHeld = () => ({ $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] });

const withLevel = ({ levelArts, ...badge }, level) => ({
  ...badge,
  art: levelArts[level] ?? levelArts[0],
  ...(levelArts.length > 1 && { levels: levelArts, level }),
});

// the order the person chose comes first, and anything they have not placed yet follows, newest first
const byChosenOrder = (first, second) => (first.position ?? Infinity) - (second.position ?? Infinity) || new Date(second.awardedAt) - new Date(first.awardedAt);

const heldBadges = async (filter) => {
  const holders = await BadgeHolderModel.find({ ...filter, ...stillHeld() }).lean();
  return holders
    .filter((holder) => catalog.has(String(holder.badge)))
    .sort(byChosenOrder)
    .map((holder) => ({
      ...withLevel(catalog.get(String(holder.badge)), holder.level ?? 0),
      awardedAt: holder.awardedAt,
      expiresAt: holder.expiresAt,
      claimedAt: holder.claimedAt,
      isHidden: holder.isHidden,
    }));
};

const asShown = ({ needsClaim, claimableOn, claimedAt, isHidden, isRetired, ...badge }) => badge;

const isOnProfile = (badge) => !badge.needsClaim || badge.claimedAt;

const isOfferedOn = (badge, platform) => badge.needsClaim && (badge.claimableOn === "anywhere" || badge.claimableOn === platform);

// a given badge shows once it is claimed, an earned one as soon as it is held
export const shownBadgesOf = async (userId) => (await heldBadges({ user: userId, isHidden: { $ne: true } })).filter(isOnProfile).map(asShown);

// the person sees their hidden badges too, marked, so they can bring them back
export const ownBadgesOf = async (userId) =>
  (await heldBadges({ user: userId })).filter(isOnProfile).map((badge) => ({ ...asShown(badge), isHidden: Boolean(badge.isHidden) }));

export const arrangeBadges = async (userId, { order, hidden }) => {
  const held = new Set((await ownBadgesOf(userId)).map((badge) => badge.id));
  const ordered = (Array.isArray(order) ? order : []).filter((id) => held.has(String(id)));
  const hiddenIds = new Set((Array.isArray(hidden) ? hidden : []).map(String));
  if (ordered.length === 0) return;
  await BadgeHolderModel.bulkWrite(
    ordered.map((id, position) => ({
      updateOne: { filter: { user: userId, badge: id }, update: { $set: { position, isHidden: hiddenIds.has(String(id)) } } },
    }))
  );
};

export const offeredBadgesOf = async (userId, platform) =>
  (await heldBadges({ user: userId, claimedAt: { $exists: false } })).filter((badge) => isOfferedOn(badge, platform)).map(asShown);

export const claimBadges = async (userId, badgeIds, platform) => {
  const ids = (Array.isArray(badgeIds) ? badgeIds : []).filter((id) => {
    const badge = mongoose.isValidObjectId(id) && catalog.get(String(id));
    return badge && isOfferedOn(badge, platform);
  });
  await BadgeHolderModel.updateMany({ user: userId, badge: { $in: ids }, claimedAt: { $exists: false } }, { $set: { claimedAt: new Date() } });
};
