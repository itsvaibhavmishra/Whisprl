import { decryptText, deriveConversationKey, encryptText, importPublicKey } from "@/utils/crypto/keys";

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
  conversation.users.flatMap((member) => member.publicKeys ?? []).find((entry) => entry.keyId === keyId);

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

// a friend with no key yet gets a message sealed to the sender, re-encrypted for them once they have one
export const encryptMessage = async (text, conversation, userId) => {
  const peerKey = peerKeyOf(conversation, userId) ?? findPublicKey(conversation, deviceKeys.keyId);
  const key = await conversationKeyFor(conversation, peerKey);
  const sealed = await encryptText(key, text, contextOf(conversation._id, userId));
  return { ...sealed, keyIds: [deviceKeys.keyId, peerKey.keyId] };
};

export const decryptMessage = async (message, conversation) => {
  if (!message?.cipher) return message;

  const senderId = message.sender?._id ?? message.sender;
  try {
    const { keyIds } = message.cipher;
    const myIndex = keyIds.indexOf(deviceKeys?.keyId);
    const peerKey = myIndex !== -1 && findPublicKey(conversation, keyIds[1 - myIndex]);
    if (!peerKey) throw new Error("No key for this message");

    const key = await conversationKeyFor(conversation, peerKey);
    return { ...message, message: await decryptText(key, message.cipher, contextOf(conversation._id, senderId)) };
  } catch {
    return { ...message, message: "", undecryptable: true };
  }
};
