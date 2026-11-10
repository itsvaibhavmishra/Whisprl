import mongoose from "mongoose";

// how one person has done against chosen bots in one game, which is all the bot's strength is picked from
const botRecordSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    game: { type: String, required: true },
    played: { type: Number, default: 0 },
    // hidden from the player: 0 is the bot at its weakest, 100 at its best
    skill: { type: Number, min: 0, max: 100 },
    // the last three results, newest last
    recent: [{ type: String, enum: ["won", "lost", "drawn"] }],
  },
  { timestamps: true }
);

botRecordSchema.index({ user: 1, game: 1 }, { unique: true });

const BotRecordModel = mongoose.model("BotRecord", botRecordSchema);

export default BotRecordModel;
