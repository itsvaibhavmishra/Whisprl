import { describe, expect, test } from "vitest";

import { teamPartnerOf } from "@/sections/chat/game/teamChat";

const group = { _id: "group", isGroup: true };
const table = (seats, extra = {}) => ({ status: "playing", startsAt: "1", seats, state: { team: [0, 1, 0, 1] }, ...extra });
const people = [{ user: "ava" }, { user: "ben" }, { user: "cal" }, { user: "dee" }];

describe("team chat", () => {
  test("is with the partner across the table who plays their own seat", () => {
    expect(teamPartnerOf(table(people), group, "ava").user).toBe("cal");
    expect(teamPartnerOf(table([people[0], people[1], { bot: true }, people[3]]), group, "ava")).toBeNull();
    expect(teamPartnerOf(table([people[0], people[1], { user: "cal", away: true }, people[3]]), group, "ava")).toBeNull();
  });

  test("is only for a team game being played in a group, by someone seated", () => {
    expect(teamPartnerOf(table(people), { _id: "pair", isGroup: false }, "ava")).toBeNull();
    expect(teamPartnerOf(table(people, { status: "lobby" }), group, "ava")).toBeNull();
    expect(teamPartnerOf(table(people), group, "eve")).toBeNull();
    expect(teamPartnerOf({ status: "playing", seats: people.slice(0, 2), state: {} }, group, "ava")).toBeNull();
  });
});
