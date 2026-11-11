// a message names its sender's key, and one of yours in a chat for two also names the key you sealed it to
const keysSeenIn = (message, meId, peerId) => {
  const senderId = message.sender?._id ?? message.sender;
  const { cipher } = message;
  if (!cipher) return [];
  if (cipher.senderKeyId) return senderId === meId ? [] : [[senderId, cipher.senderKeyId]];
  const [senderKeyId, recipientKeyId] = cipher.keyIds ?? [];
  if (senderId !== meId) return [[senderId, senderKeyId]];
  // a message sealed back to yourself, for a friend with no key yet, says nothing about theirs
  return recipientKeyId && recipientKeyId !== senderKeyId ? [[peerId, recipientKeyId]] : [];
};

export const keyChangesOf = (messages, meId, peerId = null) => {
  const lastKeyOf = new Map();
  const changes = new Map();
  messages.forEach((message) => {
    keysSeenIn(message, meId, peerId).forEach(([personId, keyId]) => {
      if (!personId || personId === meId || !keyId) return;
      const previous = lastKeyOf.get(personId);
      if (previous && previous !== keyId) changes.set(message._id, [...(changes.get(message._id) ?? []), personId]);
      lastKeyOf.set(personId, keyId);
    });
  });
  return changes;
};
