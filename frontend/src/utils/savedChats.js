import { forgetSavedChats, loadSavedChats, saveSavedChats } from "@/utils/crypto/keyStore";
import { readableText } from "@/utils/crypto/messageCipher";

// a chat opens on its newest page, so that is as far back as a saved chat needs to reach
const SAVED_MESSAGES = 60;
// a copy saved by a build that shaped it differently is ignored rather than misread
const FORMAT = 1;

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const keys = new Map();
// a sign-out bumps this, so a save still being written when it happens never lands after it
let generation = 0;

const isExpired = (message, now) => Boolean(message?.expiresAt) && new Date(message.expiresAt).getTime() <= now;

export const snapshotOf = (chat) => {
  const held = Object.fromEntries(Object.entries(chat.cache).map(([conversationId, cached]) => [conversationId, cached.messages]));
  if (chat.activeConversation && chat.messages.length) held[chat.activeConversation._id] = chat.messages;
  return {
    format: FORMAT,
    // how recently a chat was reached counts only within one launch, so the count stays behind
    conversations: chat.conversations.map(({ arrival: _, ...conversation }) => conversation),
    chats: Object.fromEntries(Object.entries(held).map(([conversationId, messages]) => [conversationId, messages.slice(-SAVED_MESSAGES)])),
    albumReactions: chat.albumReactions,
  };
};

const ascendingBy = (field) => (one, other) => (one[field] < other[field] ? -1 : 1);

const arrivedMessageOf = ({ messageId, conversationId, senderId, createdAt, expiresAt, plaintext }, conversation) => {
  const { firstName, lastName, avatar } = conversation.users.find((member) => member._id === senderId) ?? {};
  return {
    _id: messageId,
    conversation: conversationId,
    sender: { _id: senderId, firstName, lastName, avatar },
    createdAt,
    expiresAt,
    ...readableText(plaintext),
  };
};

const withArrival = (snapshot, arrival) => {
  const conversation = snapshot.conversations.find((listed) => listed._id === arrival.conversationId);
  if (!conversation) return snapshot;
  const message = arrivedMessageOf(arrival, conversation);
  const isLatest = !conversation.latestMessage || conversation.latestMessage._id < message._id;
  const saved = snapshot.chats[conversation._id];
  const isMissing = saved && !saved.some((kept) => kept._id === message._id);
  return {
    ...snapshot,
    conversations: isLatest
      ? [
          { ...conversation, latestMessage: message, unread: (conversation.unread ?? 0) + 1 },
          ...snapshot.conversations.filter((listed) => listed !== conversation),
        ]
      : snapshot.conversations,
    chats: isMissing ? { ...snapshot.chats, [conversation._id]: [...saved, message].sort(ascendingBy("_id")) } : snapshot.chats,
  };
};

// messages that reached the phone while the app was closed join the saved chats, oldest first so the newest chat ends on top
export const withArrivals = (snapshot, arrivals) => [...arrivals].sort(ascendingBy("messageId")).reduce(withArrival, snapshot);

// saved messages are marked, so the first fresh page replaces them instead of keeping one deleted in the meantime
export const restoredFrom = (snapshot, now = Date.now()) => ({
  conversations: snapshot.conversations.map((conversation) =>
    isExpired(conversation.latestMessage, now) ? { ...conversation, latestMessage: null } : conversation
  ),
  cache: Object.fromEntries(
    Object.entries(snapshot.chats).map(([conversationId, messages]) => [
      conversationId,
      {
        messages: messages.filter((message) => !isExpired(message, now)).map((message) => ({ ...message, isSaved: true })),
        hasOlderMessages: true,
      },
    ])
  ),
  albumReactions: snapshot.albumReactions,
});

// the key never leaves the browser's crypto, so the saved chats are as hard to read as this device's own message keys
const keyFor = async (userId) => {
  if (!keys.has(userId)) {
    const saved = await loadSavedChats(userId);
    keys.set(userId, saved?.key ?? (await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])));
  }
  return keys.get(userId);
};

export const saveChats = async (userId, snapshot) => {
  const startedIn = generation;
  const key = await keyFor(userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(snapshot)));
  if (startedIn === generation) await saveSavedChats(userId, { key, iv, data });
};

export const readSavedChats = async (userId) => {
  const saved = await loadSavedChats(userId);
  if (!saved) return null;
  try {
    const snapshot = JSON.parse(decoder.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: saved.iv }, saved.key, saved.data)));
    keys.set(userId, saved.key);
    return snapshot.format === FORMAT ? snapshot : null;
  } catch {
    await forgetChats(userId);
    return null;
  }
};

export const forgetChats = async (userId) => {
  generation += 1;
  keys.delete(userId);
  await forgetSavedChats(userId);
};
