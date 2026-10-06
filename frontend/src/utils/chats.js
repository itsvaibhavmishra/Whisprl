export const peerOf = (conversation, meId) =>
  conversation.users.find((member) => member._id !== meId) ?? conversation.users[0];

export const identityOf = (conversation, meId) => {
  if (conversation.isGroup) return { name: conversation.name, avatar: conversation.picture };
  const peer = peerOf(conversation, meId);
  const name = `${peer.firstName} ${peer.lastName}`;
  return { name: peer._id === meId ? `${name} (You)` : name, avatar: peer.avatar, peer };
};

// the gathered history with anything that arrived since it was gathered, oldest first and each message once
export const withArrivals = (gathered, messages) =>
  [...new Map([...(gathered?.messages ?? []), ...messages].map((message) => [message._id, message])).values()];

export const isMuted = (conversation) => Boolean(conversation.mutedUntil) && new Date(conversation.mutedUntil) > new Date();

// a live presence update outranks the status the chat list was loaded with
export const isOnline = (person, onlineFriends) =>
  (onlineFriends.find((friend) => friend._id === person._id)?.onlineStatus ?? person.onlineStatus) === "online";
