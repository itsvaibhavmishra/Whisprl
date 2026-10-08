import {
  decryptBytes,
  decryptText,
  deriveConversationKey,
  encryptBytes,
  encryptText,
  exportMessageKey,
  generateMessageKey,
  importMessageKey,
  importPublicKey,
} from "@/utils/crypto/keys";
import { decodePayload } from "@/utils/messagePayload";

let deviceKeys = null;
const conversationKeys = new Map();

export const setDeviceKeys = (keys) => {
  deviceKeys = keys;
  conversationKeys.clear();
};

const currentKeyOf = (user) => user?.publicKeys?.at(-1) ?? null;

const peerOf = (conversation, userId) =>
  conversation.users.find((member) => member._id !== userId) ?? conversation.users[0];

const findPublicKey = (conversation, keyId) =>
  [...conversation.users, ...(conversation.formerUsers ?? [])]
    .flatMap((member) => member.publicKeys ?? [])
    .find((entry) => entry.keyId === keyId);

const conversationKeyFor = (conversation, peerKey) => {
  const cacheKey = `${conversation._id}:${deviceKeys.keyId}:${peerKey.keyId}`;
  if (!conversationKeys.has(cacheKey)) {
    const { privateKey } = deviceKeys;
    conversationKeys.set(
      cacheKey,
      importPublicKey(peerKey.publicKey).then((peerPublicKey) => deriveConversationKey(privateKey, peerPublicKey, conversation._id))
    );
  }
  return conversationKeys.get(cacheKey);
};

// a reaction is bound to its message, so it can be neither replayed as a message nor moved to another one
const contextOf = (conversationId, senderId, bind) => [conversationId, senderId, bind].filter(Boolean).join(":");

// a reaction to a whole group of photos is bound to the group, so it opens only as the group's
const reactionBinding = (message, isForAlbum) => (isForAlbum ? `album-reaction:${message.batchId}` : `reaction:${message._id}`);

const peerKeyOf = (conversation, userId) => currentKeyOf(peerOf(conversation, userId));

// a group message is encrypted once, and its key sealed for each member with the key that member shares with the sender
const encryptForGroup = async (text, conversation, userId, bind) => {
  const context = contextOf(conversation._id, userId, bind);
  const messageKey = await generateMessageKey();
  const rawKey = await exportMessageKey(messageKey);

  const keys = await Promise.all(
    conversation.users.map(async (member) => {
      const memberKey = currentKeyOf(member);
      const sealed = await encryptBytes(await conversationKeyFor(conversation, memberKey), rawKey, context);
      return { keyId: memberKey.keyId, ...sealed };
    })
  );

  return { ...(await encryptText(messageKey, text, context)), senderKeyId: deviceKeys.keyId, keys };
};

// a friend with no key yet gets a message sealed to the sender, re-encrypted for them once they have one
export const encryptMessage = async (text, conversation, userId, bind) => {
  if (conversation.isGroup) return encryptForGroup(text, conversation, userId, bind);

  const peerKey = peerKeyOf(conversation, userId) ?? findPublicKey(conversation, deviceKeys.keyId);
  const key = await conversationKeyFor(conversation, peerKey);
  const sealed = await encryptText(key, text, contextOf(conversation._id, userId, bind));
  return { ...sealed, keyIds: [deviceKeys.keyId, peerKey.keyId] };
};

const openGroupMessage = async (message, conversation, senderId, bind) => {
  const sealedKey = message.cipher.keys.find((sealed) => sealed.keyId === deviceKeys?.keyId);
  const senderKey = findPublicKey(conversation, message.cipher.senderKeyId);
  if (!sealedKey || !senderKey) throw new Error("No key for this message");

  const context = contextOf(conversation._id, senderId, bind);
  const pairKey = await conversationKeyFor(conversation, senderKey);
  const messageKey = await importMessageKey(await decryptBytes(pairKey, sealedKey, context));
  return decryptText(messageKey, message.cipher, context);
};

// the text as it was sent: a message's words, or for an attachment the JSON holding its caption and file key
export const openMessage = async (message, conversation, bind) => {
  const senderId = message.sender?._id ?? message.sender;
  if (message.cipher.keys) return openGroupMessage(message, conversation, senderId, bind);

  const { keyIds } = message.cipher;
  const myIndex = keyIds.indexOf(deviceKeys?.keyId);
  const peerKey = myIndex !== -1 && findPublicKey(conversation, keyIds[1 - myIndex]);
  if (!peerKey) throw new Error("No key for this message");

  const key = await conversationKeyFor(conversation, peerKey);
  return decryptText(key, message.cipher, contextOf(conversation._id, senderId, bind));
};

export const encryptReaction = (emoji, message, conversation, userId, isForAlbum = false) =>
  encryptMessage(emoji, conversation, userId, reactionBinding(message, isForAlbum));

const readableOf = (message, plaintext) => {
  if (!message.attachment) {
    const { text, mentions, contact } = decodePayload(plaintext);
    return { message: text, mentions, contact };
  }
  const { caption, file } = JSON.parse(plaintext);
  return { message: caption ?? "", file };
};

const readContent = async (message, conversation) => {
  if (!message.cipher) return {};
  try {
    return readableOf(message, await openMessage(message, conversation));
  } catch {
    return { message: "", undecryptable: true };
  }
};

// a reaction that cannot be opened is left out rather than shown as something it may not be
const readReactions = async (sealed = [], conversation, bind) => {
  const reactions = await Promise.all(
    sealed.map(async ({ user, cipher }) => ({ user, emoji: await openMessage({ cipher, sender: user }, conversation, bind).catch(() => null) }))
  );
  return reactions.filter((reaction) => reaction.emoji);
};

export const decryptAlbumReactions = (album, conversation) => readReactions(album.reactions, conversation, reactionBinding(album, true));

export const decryptReaction = ({ cipher, user, message, batchId }, conversation) =>
  openMessage({ cipher, sender: user }, conversation, reactionBinding(message, Boolean(batchId))).catch(() => null);

export const decryptMessage = async (message, conversation) => {
  if (!message?.cipher && !message?.replyTo && !message?.reactions?.length) return message;
  const [content, replyTo, reactions] = await Promise.all([
    readContent(message, conversation),
    message.replyTo?._id ? decryptMessage(message.replyTo, conversation) : message.replyTo,
    readReactions(message.reactions, conversation, reactionBinding(message, false)),
  ]);
  return { ...message, ...content, replyTo, reactions };
};
