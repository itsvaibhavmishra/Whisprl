import mongoose from "mongoose";

const badgeHolderSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    badge: { type: mongoose.Schema.Types.ObjectId, ref: "Badge", required: true },
    level: { type: Number, default: 0 },
    awardedAt: { type: Date, default: Date.now },
    expiresAt: Date,
    from: {
      kind: { type: String, enum: ["staff", "promotion", "rule"], required: true },
      staff: mongoose.Schema.Types.ObjectId,
      promotion: mongoose.Schema.Types.ObjectId,
    },
    isHidden: { type: Boolean, default: false },
    // where the person put it among their badges, so the ones they chose show first
    position: Number,
    // unset until the person claims it in the New badge popup, and only a claimed badge shows on their profile
    claimedAt: Date,
    // when someone who joined through a tester link first opened the group, then Google Play
    linkSteps: { group: Date, play: Date },
  },
  { collection: "badgeholders" }
);

badgeHolderSchema.index({ user: 1, badge: 1 }, { unique: true });
badgeHolderSchema.index({ badge: 1 });

const BadgeHolderModel = mongoose.model("BadgeHolder", badgeHolderSchema);

export default BadgeHolderModel;
