export const summaryOf = (message) => {
  if (!message) return "";
  if (message.deletedAt) return "This message was deleted";
  if (message.undecryptable) return message.awaitingKey ? "Message on its way" : "Encrypted message";
  if (message.viewOnce) return "View once photo";
  if (message.contact) return `Contact: ${message.contact.firstName} ${message.contact.lastName}`;
  if (message.file) return message.message || (message.file.kind === "image" ? "Photo" : message.file.name);
  if (message.message) return message.message;
  return message.files?.length ? "File" : "";
};
