import mongoose from "mongoose";

const sessionSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: "User", required: true, index: true },

    tokenHash: { type: String, required: true, unique: true },

    // the token this one replaced, accepted briefly so two tabs refreshing together both succeed
    previousTokenHash: { type: String, index: { sparse: true } },
    rotatedAt: { type: Date },

    userAgent: { type: String },

    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  {
    timestamps: true,
  }
);

const SessionModel = mongoose.model("Session", sessionSchema);

export default SessionModel;
