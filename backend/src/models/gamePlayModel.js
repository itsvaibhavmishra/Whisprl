import mongoose from "mongoose";

// one game that got going, bot games included, kept only to count which games people play
const gamePlaySchema = mongoose.Schema(
  {
    game: { type: String, required: true },
    players: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

gamePlaySchema.index({ createdAt: 1 });

const GamePlayModel = mongoose.model("GamePlay", gamePlaySchema);

export default GamePlayModel;
