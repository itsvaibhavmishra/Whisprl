import mongoose from "mongoose";

// made in admin, which shares the database, so Whisprl only reads a promotion and records who joined through it
const promotionSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    badge: { type: mongoose.Schema.Types.ObjectId, ref: "Badge", required: true },
    endsAt: Date,
    endedAt: Date,
    visits: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "promotions" }
);

const PromotionModel = mongoose.model("Promotion", promotionSchema);

export default PromotionModel;
