import mongoose from "mongoose";

const artSchema = mongoose.Schema({ url: String, publicId: String, width: Number, height: Number }, { _id: false });

// made and edited in admin, which shares the database, so Whisprl only ever reads it
const badgeSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    source: { type: String, enum: ["given", "earned", "ranked"], default: "given" },
    levels: { type: [mongoose.Schema({ art: artSchema }, { _id: false })], default: [] },
    claimableOn: { type: String, enum: ["anywhere", "android"], default: "anywhere" },
    retiredAt: Date,
  },
  { timestamps: true, collection: "badges" }
);

const BadgeModel = mongoose.model("Badge", badgeSchema);

export default BadgeModel;
