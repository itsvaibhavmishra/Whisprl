import mongoose from "mongoose";

const passkeyChallengeSchema = mongoose.Schema({
  challenge: { type: String, required: true, unique: true },
  purpose: { type: String, enum: ["register", "login"], required: true },
  user: { type: mongoose.Schema.ObjectId, ref: "User" },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

const PasskeyChallengeModel = mongoose.model("PasskeyChallenge", passkeyChallengeSchema);

export default PasskeyChallengeModel;
