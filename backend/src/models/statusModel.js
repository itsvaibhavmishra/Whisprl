import mongoose from "mongoose";

import { cipherSchema } from "#src/models/messageModel.js";

const statusFileSchema = mongoose.Schema(
  {
    url: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const viewSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    viewedAt: { type: Date, required: true },
    reaction: { type: cipherSchema, default: undefined },
  },
  { _id: false }
);

// what a status shows, and whether it is text, a photo or a video, is sealed inside its cipher
const statusSchema = mongoose.Schema(
  {
    owner: { type: mongoose.Schema.ObjectId, ref: "User", required: true, index: true },
    cipher: { type: cipherSchema, required: true },
    file: { type: statusFileSchema, default: undefined },
    audience: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    views: [viewSchema],
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

statusSchema.index({ audience: 1, expiresAt: 1 });

const StatusModel = mongoose.model("Status", statusSchema);

export default StatusModel;
