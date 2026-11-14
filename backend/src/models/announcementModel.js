import mongoose from "mongoose";

// never edited once sent, since everyone it reached already has its words
const announcementSchema = mongoose.Schema(
  {
    // the staff member who sent it, which is not a Whisprl account
    author: { type: mongoose.Schema.ObjectId, required: true },
    text: { type: String, required: true, maxlength: 500 },
    button: {
      kind: { type: String, enum: ["challenge", "open"] },
      label: { type: String, maxlength: 40 },
      to: { type: String },
      // a challenge to one game opens it straight away, and marks that game as announced
      game: { type: String },
    },
    audience: { type: String, enum: ["everyone", "android", "web"], required: true },
    isPushed: { type: Boolean, default: false },
    audienceSize: { type: Number, required: true },
    reached: { type: Number, default: 0 },
    // where the last finished batch ended, so a restart carries on from there
    lastSentTo: { type: mongoose.Schema.ObjectId },
    finishedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const AnnouncementModel = mongoose.model("Announcement", announcementSchema);

export default AnnouncementModel;
