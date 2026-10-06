import mongoose from "mongoose";

const sessionSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: "User", required: true, index: true },

    // the public half of a key the browser made at login and cannot export, which checks its signature for every new access token
    publicKey: { type: String, required: true },

    userAgent: { type: String },

    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  {
    timestamps: true,
  }
);

const SessionModel = mongoose.model("Session", sessionSchema);

export default SessionModel;
