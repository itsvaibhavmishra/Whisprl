import { batchKeyOf, filesOf, isMediaFile } from "@/utils/messageFiles";
import { reactionsOf } from "@/utils/reactions";

export const UNREAD_DIVIDER = "unread-divider";

export const keyOf = (message) => message.albumKey ?? message.clientId ?? message._id;

const isMedia = (message) => filesOf(message).some(isMediaFile);

const batchOf = (members, firstSent, groupReactions) => ({
  type: "batch",
  members,
  message: {
    ...members[0],
    // the first message sent stays as a note when deleted, so keyed by it the group keeps its place and its viewer
    albumKey: `album:${keyOf(firstSent)}`,
    file: undefined,
    files: members.flatMap(filesOf),
    message: members.find((member) => member.batchIndex === 0)?.message || "",
    // the bubble counts the group's own reactions and every photo's, each remembering where it was made
    reactions: [
      ...groupReactions.map((reaction) => ({ ...reaction, isForAlbum: true })),
      ...members.flatMap((member) => reactionsOf(member).map((reaction) => ({ ...reaction, message: member }))),
    ],
    albumReactions: groupReactions,
  },
});

// photos and videos one person sent together show as a single bubble; documents, and a photo deleted from the group, stand alone
const groupPhotos = (messages, albumReactions) => {
  const groups = [];
  let start = 0;
  while (start < messages.length) {
    const key = batchKeyOf(messages[start]);
    let end = start + 1;
    while (key && end < messages.length && batchKeyOf(messages[end]) === key) end += 1;
    const sent = messages.slice(start, end);
    const album = sent.filter(isMedia);
    const groupReactions = albumReactions[key] ?? [];
    // one photo left of a group stays a group while the group has reactions of its own
    const isAlbum = album.length > 1 || (album.length === 1 && groupReactions.length > 0);
    sent.forEach((message) => {
      if (!isAlbum || !album.includes(message)) groups.push({ type: "single", message });
      else if (message === album[0]) groups.push(batchOf(album, sent[0], groupReactions));
    });
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
  replyToAlbum: entry.replyTo?.isAlbum,
  forwarded: Boolean(entry.forwardOf),
  batchId: entry.batch?.batchId,
  batchIndex: entry.batch?.batchIndex,
  viewOnce: entry.viewOnce,
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

export const displayItemsOf = (messages, outbox, me, albumReactions = {}) =>
  groupPhotos(withQueued(messages, outbox, me), albumReactions).map((group) => ({
    ...group,
    type: itemTypeOf(group),
    entry: group.message.outboxEntry,
  }));
