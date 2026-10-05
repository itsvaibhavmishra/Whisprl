import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
  }
);

requestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

const FriendRequestModel = mongoose.model("FriendRequest", requestSchema);

export default FriendRequestModel;
