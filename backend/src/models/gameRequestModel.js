import mongoose from "mongoose";

export const REQUEST_KINDS = ["classic", "new", "original"];
export const REQUEST_STATUSES = ["open", "added", "dismissed"];
export const MAX_REQUEST_NAME = 60;
export const MAX_REQUEST_DETAILS = 1000;
export const MAX_REQUEST_LINKS = 3;
export const MAX_REQUEST_LINK = 300;

const gameRequestSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: REQUEST_KINDS, required: true },
    name: { type: String, required: true },
    // requests for the same game share this, however each person spelled it
    nameKey: { type: String, required: true },
    links: { type: [String], default: [] },
    details: { type: String, default: "" },
    status: { type: String, enum: REQUEST_STATUSES, default: "open" },
    closedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

gameRequestSchema.index({ status: 1, nameKey: 1 });

const GameRequestModel = mongoose.model("GameRequest", gameRequestSchema);

export default GameRequestModel;
