import mongoose from "mongoose";

import { cipherSchema } from "#src/models/messageModel.js";

const requestSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.ObjectId, ref: "User", required: true, index: true },

    // both ids sorted and joined, so two people can have only one open request whichever way it goes
    pair: { type: String },

    // the note is sealed as the first message of this direct chat, so accepting moves it in unchanged
    conversationId: { type: mongoose.Schema.ObjectId },
    note: { type: cipherSchema, default: undefined },
  },
  {
    timestamps: true,
  }
);

requestSchema.index({ sender: 1, recipient: 1 }, { unique: true });
requestSchema.index({ pair: 1 }, { unique: true, partialFilterExpression: { pair: { $type: "string" } } });
requestSchema.index({ conversationId: 1 }, { unique: true, partialFilterExpression: { conversationId: { $type: "objectId" } } });

const FriendRequestModel = mongoose.model("FriendRequest", requestSchema);

export default FriendRequestModel;
