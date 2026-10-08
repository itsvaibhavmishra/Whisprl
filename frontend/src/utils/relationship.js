const HOUR_MS = 60 * 60 * 1000;

// one answer for every place that offers a friendship, so a profile, a search row and a contact card never disagree
export const relationshipWith = (userId, { meId, blocked, friends, incoming, outgoing, cooldowns, now = Date.now() }) => {
  if (userId === meId) return { state: "self" };
  if (blocked.includes(userId)) return { state: "blocked" };
  if (friends.some((friend) => friend._id === userId)) return { state: "friend" };

  const received = incoming.find((request) => request.person._id === userId);
  if (received) return { state: "incoming", request: received };
  const sent = outgoing.find((request) => request.person._id === userId);
  if (sent) return { state: "outgoing", request: sent };

  const cooldown = cooldowns.find((entry) => entry.user === userId && new Date(entry.until) > now);
  return cooldown ? { state: "cooldown", until: cooldown.until } : { state: "none" };
};

// rounded up, as the server rounds it, and never "0 h"
export const waitLabel = (until, now = Date.now()) => `Ask again in ${Math.max(1, Math.ceil((new Date(until) - now) / HOUR_MS))} h`;
