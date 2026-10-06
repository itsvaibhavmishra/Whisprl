import { filesOf } from "@/utils/messageFiles";

export const UNREAD_DIVIDER = "unread-divider";

export const keyOf = (message) => message.clientId ?? message._id;

const isBatchedPhoto = (message) => message.batchId && filesOf(message).some((file) => file.fileType === "image");

const batchOf = (members) => ({
  type: "batch",
  members,
  message: {
    ...members[0],
    file: undefined,
    files: members.flatMap(filesOf),
    message: members.find((member) => member.batchIndex === 0)?.message || "",
  },
});

// photos one person sent together show as a single bubble; documents always stand alone
const groupPhotos = (messages) => {
  const groups = [];
  let start = 0;
  while (start < messages.length) {
    const lead = messages[start];
    let end = start + 1;
    while (
      isBatchedPhoto(lead) &&
      end < messages.length &&
      messages[end].batchId === lead.batchId &&
      messages[end].sender?._id === lead.sender?._id
    ) {
      end += 1;
    }
    const members = messages.slice(start, end);
    groups.push(members.length > 1 ? batchOf(members) : { type: "single", message: lead });
    start = end;
  }
  return groups;
};

const queuedMessage = (entry, me) => ({
  _id: entry.clientId,
  clientId: entry.clientId,
  sender: me,
  message: entry.text ?? entry.caption ?? "",
  createdAt: entry.createdAt,
  file: entry.file,
  contact: entry.contact,
  mentions: entry.mentions,
  replyTo: entry.replyTo,
  forwarded: Boolean(entry.forwardOf),
  attachment: entry.file && { status: "uploading" },
  outboxEntry: entry,
});

// a failed message stays where it was written, and one still sending is the newest there is
const withQueued = (messages, outbox, me) => {
  const loaded = new Set(messages.map((message) => message._id));
  const failedAfter = new Map();
  const sending = [];

  outbox.forEach((entry) => {
    const anchor = entry.afterId ?? null;
    if (entry.status !== "failed" || (anchor && !loaded.has(anchor))) return sending.push(queuedMessage(entry, me));
    failedAfter.set(anchor, [...(failedAfter.get(anchor) ?? []), queuedMessage(entry, me)]);
  });

  return [
    ...(failedAfter.get(null) ?? []),
    ...messages.flatMap((message) => [message, ...(failedAfter.get(message._id) ?? [])]),
    ...sending,
  ];
};

const itemTypeOf = (group) => {
  if (group.message.outboxEntry) return "queued";
  return group.message.event ? "event" : group.type;
};

export const lastIdOf = (item) => (item.members ?? [item.message]).at(-1)._id;

export const displayItemsOf = (messages, outbox, me) =>
  groupPhotos(withQueued(messages, outbox, me)).map((group) => ({
    ...group,
    type: itemTypeOf(group),
    entry: group.message.outboxEntry,
  }));
