import mongoose from "mongoose";

import { MAX_AUDIT_REASON } from "#src/models/auditEntryModel.js";

// the audit log keeps every announcement word for word, so one can never outgrow it
export const MAX_ANNOUNCEMENT = MAX_AUDIT_REASON;
export const MAX_BUTTON_LABEL = 30;
export const AUDIENCES = ["everyone", "android", "web"];

// never edited once sent, since everyone it reached already has its words
const announcementSchema = mongoose.Schema(
  {
    author: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: MAX_ANNOUNCEMENT },
    button: {
      kind: { type: String, enum: ["challenge", "open"] },
      label: { type: String, maxlength: MAX_BUTTON_LABEL },
      to: { type: String },
    },
    audience: { type: String, enum: AUDIENCES, required: true },
    isPushed: { type: Boolean, default: false },
    audienceSize: { type: Number, required: true },
    reached: { type: Number, default: 0 },
    // the last person it was handed to, so a restart carries on after them
    lastSentTo: { type: mongoose.Schema.ObjectId },
    finishedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const AnnouncementModel = mongoose.model("Announcement", announcementSchema);

export default AnnouncementModel;
