import { isMediaFile } from "@/utils/messageFiles";

// to its sender a view-once message is opened once anyone has opened it, and to everyone else once they have
export const isViewOnceOpened = (message, meId) => {
  const viewers = message.viewedBy ?? [];
  const senderId = message.sender?._id ?? message.sender;
  return senderId === meId ? viewers.length > 0 : viewers.includes(meId) || message.attachment?.status === "opened";
};

export const summaryOf = (message) => {
  if (!message) return "";
  if (message.deletedAt) return "This message was deleted";
  if (message.undecryptable) return message.awaitingKey ? "Message on its way" : "Encrypted message";
  if (message.viewOnce) return message.file?.kind === "video" ? "View once video" : "View once photo";
  if (message.contact) return `Contact: ${message.contact.firstName} ${message.contact.lastName}`;
  if (message.statusQuote && !message.message) return message.statusQuote.isMention ? "Mentioned in a status" : "Replied to a status";
  if (message.file) return message.message || { image: "Photo", video: "Video", voice: "Voice message" }[message.file.kind] || message.file.name;
  if (message.message) return message.message;
  if (!message.files?.length) return "";
  const media = message.files.filter(isMediaFile);
  if (media.length > 1) return "Photos";
  return media.length ? { image: "Photo", video: "Video" }[media[0].fileType] : "File";
};

// a quoted view-once message is only ever words, and says when it has been opened
export const quoteSummaryOf = (message, meId) => (message.viewOnce && !message.deletedAt && isViewOnceOpened(message, meId) ? "Opened" : summaryOf(message));
