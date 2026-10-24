import createHttpError from "http-errors";
import mongoose from "mongoose";

import { MAX_EVIDENCE_MESSAGES, MAX_EVIDENCE_TEXT, MAX_REPORT_NOTE, REPORT_REASONS } from "#src/models/reportModel.js";
import { MessageModel, ReportModel, UserModel } from "#src/models/index.js";
import { matchesFranking } from "#src/utils/franking.js";
import { findMemberConversation } from "#src/services/conversationService.js";
import { isCloudinaryFile } from "#src/services/fileUploadService.js";

const assertReason = (reason, note) => {
  if (!REPORT_REASONS.includes(reason)) throw createHttpError.BadRequest("Choose why you are reporting this");
  if (typeof note !== "string" || note.length > MAX_REPORT_NOTE) {
    throw createHttpError.BadRequest(`Keep the note under ${MAX_REPORT_NOTE} characters`);
  }
};

const asFile = ({ url, key, iv, mimeType, name }) => ({ url, key, iv, mimeType, name });

// an attached file is only ever one Whisprl stored, so a report cannot point the panel somewhere else
const filesIn = (files) => {
  const allowed = Array.isArray(files) ? files.filter((file) => isCloudinaryFile(file?.url)).map(asFile) : [];
  return allowed.length ? allowed : undefined;
};

// the reporter's device sends this, so each message is weighed against the fingerprint its sender left
const asEvidence = async (sent, conversation_id) => {
  if (!Array.isArray(sent) || !sent.length) return undefined;
  if (sent.length > MAX_EVIDENCE_MESSAGES) throw createHttpError.BadRequest("That is more messages than a report can carry");
  if (!conversation_id) throw createHttpError.BadRequest("Messages can only be reported from the chat they are in");

  const ids = sent.map(({ message }) => message).filter((id) => mongoose.isValidObjectId(id));
  const saved = await MessageModel.find({ _id: { $in: ids }, conversation: conversation_id })
    .select("franking")
    .lean();
  const frankingOf = new Map(saved.map(({ _id, franking }) => [String(_id), franking]));

  const checkOf = (message, plaintext) => {
    const franking = frankingOf.get(String(message));
    if (!franking) return "unchecked";
    return matchesFranking(plaintext, franking) ? "verified" : "failed";
  };

  return sent.map(({ message, sender, sentAt, text, files, isReported, plaintext }) => ({
    ...(mongoose.isValidObjectId(message) && { message }),
    ...(mongoose.isValidObjectId(sender) && { sender }),
    sentAt: new Date(sentAt),
    text: String(text ?? "").slice(0, MAX_EVIDENCE_TEXT),
    files: filesIn(files),
    isReported: Boolean(isReported),
    check: checkOf(message, plaintext),
  }));
};

// someone met outside any chat, like a stranger asking to be friends, is reported on their own
const filePersonReport = async (user, user_id, reason, note) => {
  if (!mongoose.isValidObjectId(user_id) || user._id.equals(user_id) || !(await UserModel.exists({ _id: user_id }))) {
    throw createHttpError.BadRequest("Choose someone to report");
  }
  await ReportModel.create({ reporter: user._id, reportedUser: user_id, reason, note });
};

export const fileReport = async (user, { conversation_id, user_id, reason, note = "", evidence }) => {
  assertReason(reason, note);
  if (!conversation_id) return filePersonReport(user, user_id, reason, note);

  const conversation = await findMemberConversation(conversation_id, user._id);

  const isReportable = (id) => [...conversation.users, ...conversation.formerUsers].some((member) => member.equals(id)) && !user._id.equals(id);
  if (user_id && !isReportable(user_id)) throw createHttpError.BadRequest("You can only report someone from a chat you share");

  await ReportModel.create({
    reporter: user._id,
    reportedUser: user_id || undefined,
    conversation: conversation._id,
    reason,
    note,
    evidence: await asEvidence(evidence, conversation._id),
  });
};

export const fileStatusReport = async (user, status, { reason, note = "" }) => {
  assertReason(reason, note);
  await ReportModel.create({ reporter: user._id, reportedUser: status.owner, reportedStatus: status._id, reason, note });
};
