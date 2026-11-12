import { describe, expect, test } from "vitest";

import { lobbyLineOf, resultLineOf } from "@/sections/chat/game/gameStatus";

const conversation = {
  isGroup: true,
  users: [
    { _id: "me", firstName: "Sam" },
    { _id: "ava", firstName: "Ava" },
    { _id: "leo", firstName: "Leo" },
  ],
};

describe("the result line", () => {
  test("names a single winner", () => {
    expect(resultLineOf({ winners: [{ user: "ava" }] }, conversation, "me")).toBe("Ava won");
  });

  test("names both partners of a winning team, you first", () => {
    expect(resultLineOf({ winners: [{ user: "ava" }, { user: "leo" }] }, conversation, "me")).toBe("Ava and Leo won");
    expect(resultLineOf({ winners: [{ user: "ava" }, { user: "me" }] }, conversation, "me")).toBe("You and Ava won");
  });

  test("calls a game nobody won a draw", () => {
    expect(resultLineOf({ winners: [] }, conversation, "me")).toBe("It's a draw");
  });
});

describe("the lobby line between two at a table of four", () => {
  const direct = {
    isGroup: false,
    users: [
      { _id: "me", firstName: "Sam" },
      { _id: "ava", firstName: "Ava" },
    ],
  };
  const bot = { bot: true, ready: true };

  test("waits for the friend while their seat is saved, though bots fill the others", () => {
    const seats = [{ user: "me", ready: false }, bot, { invited: "ava" }, bot];
    expect(lobbyLineOf({ seats }, direct, "me")).toBe("Waiting for Ava to sit down");
  });

  test("plays the bots in a chat with yourself", () => {
    const yourself = { isGroup: false, users: [{ _id: "me", firstName: "Sam" }] };
    expect(lobbyLineOf({ seats: [{ user: "me", ready: false }, bot, bot, bot] }, yourself, "me")).toBe("Press Ready to play the bot");
  });

  test("says it is the bot once the friend's seat has gone to one", () => {
    const seats = [{ user: "me", ready: false }, bot, bot, bot];
    expect(lobbyLineOf({ seats }, direct, "me")).toBe("Press Ready to play the bot");
  });
});
