import mongoose from "mongoose";

// one row for each day an account opened Whisprl, which is what counts it as active that day
const activitySchema = mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  day: { type: String, required: true },
  platforms: [{ type: String, enum: ["web", "android"] }],
});

activitySchema.index({ user: 1, day: 1 }, { unique: true });
activitySchema.index({ day: 1 });

const ActivityModel = mongoose.model("Activity", activitySchema);

export default ActivityModel;
