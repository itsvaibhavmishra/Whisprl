import mongoose from "mongoose";

// one finished game, kept so a chat can keep score; a seat the bot finished still counts for its player
const gameResultSchema = mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.ObjectId, ref: "Conversation", required: true },
    game: { type: String, required: true },
    players: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    // nobody, for a draw
    winners: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

gameResultSchema.index({ conversation: 1, game: 1 });

const GameResultModel = mongoose.model("GameResult", gameResultSchema);

export default GameResultModel;
