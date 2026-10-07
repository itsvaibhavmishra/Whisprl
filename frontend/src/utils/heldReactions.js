// your own reaction while its request is out, so the echo of an earlier change cannot flicker it back
const held = new Map();

export const holdReaction = (key, emoji) => {
  const hold = { emoji };
  held.set(key, hold);
  return () => held.get(key) === hold && held.delete(key);
};

export const withHeldReaction = (key, reactions = [], userId) => {
  const hold = held.get(key);
  if (!hold) return reactions;
  const others = reactions.filter((reaction) => reaction.user !== userId);
  return hold.emoji ? [...others, { user: userId, emoji: hold.emoji }] : others;
};
