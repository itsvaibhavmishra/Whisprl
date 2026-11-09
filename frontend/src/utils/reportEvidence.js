import { filesOf } from "@/utils/messageFiles";

const AROUND = 5;
const EVIDENCE_LIMIT = AROUND * 2 + 1;

const asEvidence = (message, reportedId) => ({
  message: message._id,
  sender: message.sender?._id ?? message.sender,
  sentAt: message.createdAt,
  text: message.message ?? "",
  // an encrypted file keeps its address and key under sealed
  files: filesOf(message)
    .map(({ sealed, url, mimeType, fileName }) => ({ url: sealed?.url ?? url, key: sealed?.key, iv: sealed?.iv, mimeType, name: fileName }))
    .filter((file) => file.url),
  isReported: message._id === reportedId,
  plaintext: message.plaintext,
});

const canBeSent = (message) => !message.event && !message.deletedAt && !message.undecryptable && !message.viewOnce;

// a reported message goes with what was said around it, and a whole chat goes with however it ended
export const evidenceAround = (messages, reportedId) => {
  const usable = messages.filter(canBeSent);
  const at = reportedId ? usable.findIndex((message) => message._id === reportedId) : -1;
  const window = at === -1 ? usable.slice(-EVIDENCE_LIMIT) : usable.slice(Math.max(0, at - AROUND), at + AROUND + 1);
  return window.map((message) => asEvidence(message, reportedId));
};
