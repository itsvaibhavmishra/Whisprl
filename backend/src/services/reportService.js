import createHttpError from "http-errors";

import { MAX_REPORT_NOTE, REPORT_REASONS } from "#src/models/reportModel.js";
import { ReportModel } from "#src/models/index.js";
import { findMemberConversation } from "#src/services/conversationService.js";

export const fileReport = async (user, { conversation_id, user_id, reason, note = "" }) => {
  const conversation = await findMemberConversation(conversation_id, user._id);
  if (!REPORT_REASONS.includes(reason)) throw createHttpError.BadRequest("Choose why you are reporting this");
  if (typeof note !== "string" || note.length > MAX_REPORT_NOTE) {
    throw createHttpError.BadRequest(`Keep the note under ${MAX_REPORT_NOTE} characters`);
  }

  const isReportable = (id) => [...conversation.users, ...conversation.formerUsers].some((member) => member.equals(id)) && !user._id.equals(id);
  if (user_id && !isReportable(user_id)) throw createHttpError.BadRequest("You can only report someone from a chat you share");

  await ReportModel.create({ reporter: user._id, reportedUser: user_id || undefined, conversation: conversation._id, reason, note });
};
