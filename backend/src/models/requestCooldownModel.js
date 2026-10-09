import mongoose from "mongoose";

// outlives the request it came from, so a declined sender waits before asking the same person again
const cooldownSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  until: { type: Date, required: true },
});

cooldownSchema.index({ sender: 1, recipient: 1 }, { unique: true });
// Mongo sweeps a lapsed one within about a minute, so reads still compare until themselves
cooldownSchema.index({ until: 1 }, { expireAfterSeconds: 0 });

const RequestCooldownModel = mongoose.model("RequestCooldown", cooldownSchema);

export default RequestCooldownModel;
