import mongoose from "mongoose";

import { reactionSchema } from "#src/models/messageModel.js";

// photos sent together are one group, and the group's own reactions belong to it rather than to any one photo
const albumSchema = mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    batchId: { type: String, required: true },
    reactions: [reactionSchema],
  },
  { timestamps: true }
);

albumSchema.index({ conversation: 1, sender: 1, batchId: 1 }, { unique: true });

const AlbumModel = mongoose.model("Album", albumSchema);

export default AlbumModel;
