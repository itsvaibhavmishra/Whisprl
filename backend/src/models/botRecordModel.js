import mongoose from "mongoose";

// how one person has done against chosen bots in one game, which is all the bot's level is picked from
const botRecordSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    game: { type: String, required: true },
    played: { type: Number, default: 0 },
    // the last two results, newest last
    recent: [{ type: String, enum: ["won", "lost", "drawn"] }],
  },
  { timestamps: true }
);

botRecordSchema.index({ user: 1, game: 1 }, { unique: true });

const BotRecordModel = mongoose.model("BotRecord", botRecordSchema);

export default BotRecordModel;
