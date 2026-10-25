import mongoose from "mongoose";

export const REPORT_REASONS = ["spam", "harassment", "inappropriate", "impersonation", "other"];
export const MAX_REPORT_NOTE = 500;
const REPORT_OUTCOMES = ["actioned", "dismissed"];
export const MAX_EVIDENCE_MESSAGES = 11;
export const MAX_EVIDENCE_TEXT = 4000;
// "unchecked" covers a message sent before Whisprl kept fingerprints, which is not the same as one that failed
const EVIDENCE_CHECKS = ["verified", "unchecked", "failed"];

// the key opens this one file and nothing else, and it is here only because the reporter chose to send it
const evidenceFileSchema = mongoose.Schema({ url: { type: String, required: true }, key: String, iv: String, mimeType: String, name: String }, { _id: false });

// plaintext the reporter's device decrypted and sent on purpose, which is the only way staff can read a chat
const evidenceSchema = mongoose.Schema(
  {
    message: { type: mongoose.Schema.ObjectId, ref: "Message" },
    sender: { type: mongoose.Schema.ObjectId, ref: "User" },
    sentAt: Date,
    text: { type: String, maxlength: MAX_EVIDENCE_TEXT },
    files: { type: [evidenceFileSchema], default: undefined },
    isReported: Boolean,
    check: { type: String, enum: EVIDENCE_CHECKS, required: true },
  },
  { _id: false }
);

// messages stay encrypted, so a report carries only what the reporter wrote and chose to attach
const reportSchema = mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    reportedUser: { type: mongoose.Schema.ObjectId, ref: "User" },
    conversation: { type: mongoose.Schema.ObjectId, ref: "Conversation" },
    reportedStatus: { type: mongoose.Schema.ObjectId, ref: "Status" },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    note: { type: String, trim: true, maxlength: MAX_REPORT_NOTE },
    evidence: { type: [evidenceSchema], default: undefined },
    outcome: { type: String, enum: REPORT_OUTCOMES },
    closedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

const ReportModel = mongoose.model("Report", reportSchema);

export default ReportModel;
