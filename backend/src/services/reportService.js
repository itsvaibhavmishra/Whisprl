import createHttpError from "http-errors";
import mongoose from "mongoose";

import { MAX_EVIDENCE_MESSAGES, MAX_EVIDENCE_TEXT, MAX_REPORT_NOTE, REPORT_REASONS } from "#src/models/reportModel.js";
import { MessageModel, ReportModel, UserModel } from "#src/models/index.js";
import { matchesFranking, textIn } from "#src/utils/franking.js";
import { findMemberConversation } from "#src/services/conversationService.js";

const assertReason = (reason, note) => {
  if (!REPORT_REASONS.includes(reason)) throw createHttpError.BadRequest("Choose why you are reporting this");
  if (typeof note !== "string" || note.length > MAX_REPORT_NOTE) {
    throw createHttpError.BadRequest(`Keep the note under ${MAX_REPORT_NOTE} characters`);
  }
};

const asFile = ({ url, key, iv, mimeType, name }) => ({ url, key, iv, mimeType, name });

const storedUrlsOf = (message) => [message?.attachment?.url, ...(message?.files ?? []).map((file) => file.url)].filter(Boolean);

// a file is kept only if Whisprl stored it for the very message it comes with, so a report cannot point the panel anywhere else
export const evidenceFilesOf = (files, message) => {
  const storedUrls = storedUrlsOf(message);
  const allowed = Array.isArray(files) ? files.filter((file) => storedUrls.includes(file?.url)).map(asFile) : [];
  return allowed.length ? allowed : undefined;
};

// who sent a message and when come from Whisprl's own copy wherever it still has one
const asSentBy = (original, sender, sentAt) =>
  original ? { sender: original.sender, sentAt: original.createdAt } : { ...(mongoose.isValidObjectId(sender) && { sender }), sentAt: new Date(sentAt) };

// the reporter's device sends this, so each message is weighed against the fingerprint its sender left
const asEvidence = async (sent, conversation_id) => {
  if (!Array.isArray(sent) || !sent.length) return undefined;
  if (sent.length > MAX_EVIDENCE_MESSAGES) throw createHttpError.BadRequest("That is more messages than a report can carry");
  if (!conversation_id) throw createHttpError.BadRequest("Messages can only be reported from the chat they are in");

  const ids = sent.map(({ message }) => message).filter((id) => mongoose.isValidObjectId(id));
  const saved = await MessageModel.find({ _id: { $in: ids }, conversation: conversation_id })
    .select("franking attachment files sender createdAt")
    .lean();
  const savedOf = new Map(saved.map((original) => [String(original._id), original]));

  const checkOf = (original, plaintext) => {
    if (!original?.franking) return "unchecked";
    return matchesFranking(plaintext, original.franking) ? "verified" : "failed";
  };

  return sent.map(({ message, sender, sentAt, text, files, isReported, plaintext }) => {
    const original = savedOf.get(String(message));
    const check = checkOf(original, plaintext);
    return {
      ...(mongoose.isValidObjectId(message) && { message }),
      ...asSentBy(original, sender, sentAt),
      // a checked message shows the words its fingerprint covers, not a second copy the reporter could change
      text: (check === "verified" ? textIn(plaintext) : String(text ?? "")).slice(0, MAX_EVIDENCE_TEXT),
      files: evidenceFilesOf(files, original),
      isReported: Boolean(isReported),
      check,
    };
  });
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
