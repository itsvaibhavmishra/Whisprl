import createHttpError from "http-errors";
import mongoose from "mongoose";

import { MAX_REPORT_NOTE, REPORT_REASONS } from "#src/models/reportModel.js";
import { ReportModel, UserModel } from "#src/models/index.js";
import { findMemberConversation } from "#src/services/conversationService.js";

const assertReason = (reason, note) => {
  if (!REPORT_REASONS.includes(reason)) throw createHttpError.BadRequest("Choose why you are reporting this");
  if (typeof note !== "string" || note.length > MAX_REPORT_NOTE) {
    throw createHttpError.BadRequest(`Keep the note under ${MAX_REPORT_NOTE} characters`);
  }
};

// someone met outside any chat, like a stranger asking to be friends, is reported on their own
const filePersonReport = async (user, user_id, reason, note) => {
  if (!mongoose.isValidObjectId(user_id) || user._id.equals(user_id) || !(await UserModel.exists({ _id: user_id }))) {
    throw createHttpError.BadRequest("Choose someone to report");
  }
  await ReportModel.create({ reporter: user._id, reportedUser: user_id, reason, note });
};

export const fileReport = async (user, { conversation_id, user_id, reason, note = "" }) => {
  assertReason(reason, note);
  if (!conversation_id) return filePersonReport(user, user_id, reason, note);

  const conversation = await findMemberConversation(conversation_id, user._id);

  const isReportable = (id) => [...conversation.users, ...conversation.formerUsers].some((member) => member.equals(id)) && !user._id.equals(id);
  if (user_id && !isReportable(user_id)) throw createHttpError.BadRequest("You can only report someone from a chat you share");

  await ReportModel.create({ reporter: user._id, reportedUser: user_id || undefined, conversation: conversation._id, reason, note });
};

export const fileStatusReport = async (user, status, { reason, note = "" }) => {
  assertReason(reason, note);
  await ReportModel.create({ reporter: user._id, reportedUser: status.owner, reportedStatus: status._id, reason, note });
};
