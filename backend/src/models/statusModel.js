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

// what a status shows is sealed inside its cipher, unless it is for everyone, when it is kept as it is in content
const statusSchema = mongoose.Schema(
  {
    owner: { type: mongoose.Schema.ObjectId, ref: "User", required: true, index: true },
    isPublic: { type: Boolean, default: false },
    cipher: { type: cipherSchema, required() { return !this.isPublic; } },
    content: { type: mongoose.Schema.Types.Mixed, default: undefined },
    file: { type: statusFileSchema, default: undefined },
    audience: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    excluded: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    views: [viewSchema],
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

statusSchema.index({ audience: 1, expiresAt: 1 });
statusSchema.index({ isPublic: 1, expiresAt: 1 });

const StatusModel = mongoose.model("Status", statusSchema);

export default StatusModel;
