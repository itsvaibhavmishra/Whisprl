import { isMediaFile } from "@/utils/messageFiles";

// to its sender a view-once message is opened once anyone has opened it, and to everyone else once they have
export const isViewOnceOpened = (message, meId) => {
  const viewers = message.viewedBy ?? [];
  const senderId = message.sender?._id ?? message.sender;
  return senderId === meId ? viewers.length > 0 : viewers.includes(meId) || message.attachment?.status === "opened";
};

export const reportSubjectOf = ({ about, name }) => ({ person: name, status: `${name}'s status`, group: name })[about];

// Whisprl's own messages carry what they are about, and their words are written here
const NOTICE_SUMMARIES = {
  welcome: () => "Hi, I'm Whisprl 👋",
  inviteJoined: ({ name }) => `${name} joined Whisprl from your invite 🎉`,
  challenge: ({ gameName }) => `🎮 A challenge to ${gameName}`,
  reportReceived: (notice) => `We got your report about ${reportSubjectOf(notice)}`,
  reportActioned: (notice) => `We took action on your report about ${reportSubjectOf(notice)}`,
  reportDismissed: (notice) => `We looked at your report about ${reportSubjectOf(notice)}`,
};

export const summaryOf = (message) => {
  if (!message) return "";
  if (message.notice) return NOTICE_SUMMARIES[message.notice.type]?.(message.notice) ?? "";
  if (message.deletedAt) return "This message was deleted";
  if (message.undecryptable) return message.awaitingKey ? "Message on its way" : "Encrypted message";
  if (message.viewOnce) return message.file?.kind === "video" ? "View once video" : "View once photo";
  if (message.contact) return `Contact: ${message.contact.firstName} ${message.contact.lastName}`;
  if (message.statusQuote && !message.message)
    return { mention: "Mentioned in a status", share: "Shared a status" }[message.statusQuote.about] ?? "Replied to a status";
  if (message.file) return message.message || { image: "Photo", video: "Video", voice: "Voice message" }[message.file.kind] || message.file.name;
  if (message.message) return message.message;
  if (!message.files?.length) return "";
  const media = message.files.filter(isMediaFile);
  if (media.length > 1) return "Photos";
  return media.length ? { image: "Photo", video: "Video" }[media[0].fileType] : "File";
};

// a quoted view-once message is only ever words, and says when it has been opened
export const quoteSummaryOf = (message, meId) => (message.viewOnce && !message.deletedAt && isViewOnceOpened(message, meId) ? "Opened" : summaryOf(message));
