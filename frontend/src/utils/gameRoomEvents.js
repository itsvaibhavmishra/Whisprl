// a word said or an emoji thrown at a game is seen once and gone, so it goes straight to the room, not the store

const listeners = new Set();

export const onRoomEvent = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// { conversationId, from, text } for a message, { conversationId, from, emoji } for a reaction
export const emitRoomEvent = (event) => listeners.forEach((listener) => listener(event));

// the emoji anyone at a game can throw, the same list the server accepts
export const REACTIONS = ["😂", "😮", "😍", "👏", "🔥", "😢", "😡", "👍"];
