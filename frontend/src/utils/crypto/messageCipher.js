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

const contextOf = (conversationId, senderId) => `${conversationId}:${senderId}`;

const peerKeyOf = (conversation, userId) => currentKeyOf(peerOf(conversation, userId));

// a group message is encrypted once, and its key sealed for each member with the key that member shares with the sender
const encryptForGroup = async (text, conversation, userId) => {
  const context = contextOf(conversation._id, userId);
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
export const encryptMessage = async (text, conversation, userId) => {
  if (conversation.isGroup) return encryptForGroup(text, conversation, userId);

  const peerKey = peerKeyOf(conversation, userId) ?? findPublicKey(conversation, deviceKeys.keyId);
  const key = await conversationKeyFor(conversation, peerKey);
  const sealed = await encryptText(key, text, contextOf(conversation._id, userId));
  return { ...sealed, keyIds: [deviceKeys.keyId, peerKey.keyId] };
};

const openGroupMessage = async (message, conversation, senderId) => {
  const sealedKey = message.cipher.keys.find((sealed) => sealed.keyId === deviceKeys?.keyId);
  const senderKey = findPublicKey(conversation, message.cipher.senderKeyId);
  if (!sealedKey || !senderKey) throw new Error("No key for this message");

  const context = contextOf(conversation._id, senderId);
  const pairKey = await conversationKeyFor(conversation, senderKey);
  const messageKey = await importMessageKey(await decryptBytes(pairKey, sealedKey, context));
  return decryptText(messageKey, message.cipher, context);
};

// the text as it was sent: a message's words, or for an attachment the JSON holding its caption and file key
export const openMessage = async (message, conversation) => {
  const senderId = message.sender?._id ?? message.sender;
  if (message.cipher.keys) return openGroupMessage(message, conversation, senderId);

  const { keyIds } = message.cipher;
  const myIndex = keyIds.indexOf(deviceKeys?.keyId);
  const peerKey = myIndex !== -1 && findPublicKey(conversation, keyIds[1 - myIndex]);
  if (!peerKey) throw new Error("No key for this message");

  const key = await conversationKeyFor(conversation, peerKey);
  return decryptText(key, message.cipher, contextOf(conversation._id, senderId));
};

const readableOf = (message, plaintext) => {
  if (!message.attachment) return { ...message, message: plaintext };
  const { caption, file } = JSON.parse(plaintext);
  return { ...message, message: caption ?? "", file };
};

export const decryptMessage = async (message, conversation) => {
  if (!message?.cipher) return message;

  try {
    return readableOf(message, await openMessage(message, conversation));
  } catch {
    return { ...message, message: "", undecryptable: true };
  }
};
