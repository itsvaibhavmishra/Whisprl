import createHttpError from "http-errors";

import { BadgeHolderModel, PromotionModel } from "#src/models/index.js";
import { badgeOf, refreshBadges } from "#src/services/badgeService.js";

const STEPS = ["group", "play"];

// admin can make a badge and its link a moment apart, before the badge list next refreshes on its own
const freshBadgeOf = async (badgeId) => {
  if (!badgeOf(badgeId)) await refreshBadges();
  return badgeOf(badgeId);
};

const findPromotion = async (code) => {
  const promotion = typeof code === "string" && (await PromotionModel.findOne({ code: code.trim() }).lean());
  const found = promotion && (await freshBadgeOf(promotion.badge));
  if (!found) throw createHttpError.NotFound("This link doesn't lead anywhere. Check it was copied in full.");
  const { isRetired, ...badge } = found;
  const isOpen = !isRetired && !promotion.endedAt && (!promotion.endsAt || promotion.endsAt > new Date());
  return { promotion, badge, isOpen };
};

const assertOpen = (isOpen) => {
  if (!isOpen) throw createHttpError.Gone("This link has ended.");
};

// the step someone is on, where a first-time joiner has no record yet
export const stageOf = (held) => {
  if (held?.claimedAt) return "claimed";
  if (held?.linkSteps?.play) return "app";
  return held?.linkSteps?.group ? "play" : "group";
};

export const readPromotion = async (code) => {
  const { badge, isOpen } = await findPromotion(code);
  assertOpen(isOpen);
  return { badge };
};

export const countVisit = async (code) => {
  const { promotion } = await findPromotion(code);
  await PromotionModel.updateOne({ _id: promotion._id }, { $inc: { visits: 1 } });
};

// any account may join once, new or old, and someone who already joined carries on from the step they reached
export const joinPromotion = async (user, code) => {
  const { promotion, badge, isOpen } = await findPromotion(code);
  const holding = { user: user._id, badge: promotion.badge };
  const held = await BadgeHolderModel.findOne(holding).select("claimedAt linkSteps").lean();
  if (!held) {
    assertOpen(isOpen);
    await BadgeHolderModel.updateOne(
      holding,
      { $setOnInsert: { awardedAt: new Date(), from: { kind: "promotion", promotion: promotion._id } } },
      { upsert: true }
    );
  }
  return { badge, stage: stageOf(held) };
};

// only the first time counts, and only for someone who came through this link, so the link's numbers stay its own
export const markStep = async (user, code, step) => {
  if (!STEPS.includes(step)) throw createHttpError.BadRequest("Unknown step");
  const { promotion } = await findPromotion(code);
  const field = `linkSteps.${step}`;
  await BadgeHolderModel.updateOne(
    { user: user._id, badge: promotion.badge, "from.promotion": promotion._id, [field]: null },
    { $set: { [field]: new Date() } }
  );
};
