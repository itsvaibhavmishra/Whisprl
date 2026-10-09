import { relationshipWith, waitLabel } from "@/utils/relationship";

const NOW = Date.parse("2026-10-09T12:00:00Z");
const HOUR = 60 * 60 * 1000;

const people = {
  meId: "me",
  blocked: ["blockedFriend"],
  friends: [{ _id: "me" }, { _id: "friend" }, { _id: "blockedFriend" }],
  incoming: [{ person: { _id: "asker" } }],
  outgoing: [{ person: { _id: "asked" } }],
  cooldowns: [
    { user: "declined", until: new Date(NOW + 23 * HOUR).toISOString() },
    { user: "lapsed", until: new Date(NOW - 1).toISOString() },
  ],
  now: NOW,
};

test.each([
  ["me", "self"],
  ["friend", "friend"],
  ["blockedFriend", "blocked"],
  ["asker", "incoming"],
  ["asked", "outgoing"],
  ["declined", "cooldown"],
  ["lapsed", "none"],
  ["stranger", "none"],
])("%s is %s", (userId, state) => {
  expect(relationshipWith(userId, people).state).toBe(state);
});

test("someone who asked you is never offered a new request, even with one of yours on cooldown", () => {
  expect(relationshipWith("asker", { ...people, cooldowns: [{ user: "asker", until: new Date(NOW + HOUR).toISOString() }] }).state).toBe("incoming");
});

test("the wait rounds up to the hour and never reads zero", () => {
  expect(waitLabel(NOW + 22.2 * HOUR, NOW)).toBe("Ask again in 23 h");
  expect(waitLabel(NOW + 60 * 1000, NOW)).toBe("Ask again in 1 h");
  expect(waitLabel(NOW - HOUR, NOW)).toBe("Ask again in 1 h");
});
