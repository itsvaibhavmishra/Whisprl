import mongoose from "mongoose";

const GAME_STATUSES = ["lobby", "countdown", "playing"];

const seatSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: "User" },
    ready: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    invited: { type: mongoose.Schema.ObjectId, ref: "User" },
    // the player left mid-game, so the seat still counts as theirs while a bot plays it
    bot: { type: Boolean, default: false },
    // turns missed in a row; two hand the seat to the bot until its player comes back
    missed: { type: Number, default: 0 },
    away: { type: Boolean, default: false },
  },
  { _id: false }
);

// one per conversation: the lobby, then the game itself, until someone closes it
const gameSessionSchema = mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.ObjectId, ref: "Conversation", required: true, unique: true },
    game: { type: String, required: true },
    status: { type: String, enum: GAME_STATUSES, default: "lobby" },
    seats: [seatSchema],
    // deadlines rather than running timers, so a restart can pick a countdown or a turn back up
    startsAt: { type: Date },
    // a turn's clock starts once the last play has finished showing, which can be a moment after the turn changed
    turnStartsAt: { type: Date },
    turnEndsAt: { type: Date },
    // the settings chosen in the lobby, shaped by the game; a game without any never sets it
    options: { type: mongoose.Schema.Types.Mixed },
    // shaped by the game being played, and only the game reads it
    state: { type: mongoose.Schema.Types.Mixed },
    // who won the last game, kept in the lobby until the next one starts
    result: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

gameSessionSchema.index({ "seats.user": 1 });

const GameSessionModel = mongoose.model("GameSession", gameSessionSchema);

export default GameSessionModel;
