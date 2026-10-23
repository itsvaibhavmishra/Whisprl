import { placeOf } from "@/sections/chat/game/useRoomChatter";

const seats = [{ user: "ava" }, { bot: true }];
const direct = { _id: "chat", isGroup: false };
const group = { _id: "group", isGroup: true };

test("a player's words show at their seat", () => {
  expect(placeOf({ from: "ava" }, { conversation: direct, seats, lookers: [] })).toBe("seat");
});

test("in a chat between two, anyone not playing drifts across the game", () => {
  expect(placeOf({ from: "riya" }, { conversation: direct, seats, lookers: [] })).toBe("float");
});

test("in a group, only someone with the game on screen drifts across it", () => {
  expect(placeOf({ from: "ben" }, { conversation: group, seats, lookers: ["ben"] })).toBe("float");
  expect(placeOf({ from: "cleo" }, { conversation: group, seats, lookers: ["ben"] })).toBeNull();
});
