import mongoose from "mongoose";

export const REPORT_REASONS = ["spam", "harassment", "inappropriate", "impersonation", "other"];
export const MAX_REPORT_NOTE = 500;

// kept for a future admin panel; messages stay encrypted, so a report on a chat holds only what the reporter wrote
const reportSchema = mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
    reportedUser: { type: mongoose.Schema.ObjectId, ref: "User" },
    conversation: { type: mongoose.Schema.ObjectId, ref: "Conversation" },
    reportedStatus: { type: mongoose.Schema.ObjectId, ref: "Status" },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    note: { type: String, trim: true, maxlength: MAX_REPORT_NOTE },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

const ReportModel = mongoose.model("Report", reportSchema);

export default ReportModel;
