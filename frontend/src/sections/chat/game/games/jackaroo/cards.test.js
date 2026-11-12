import { describe, expect, test } from "vitest";

import { bannerOf, faceOf } from "@/sections/chat/game/games/jackaroo/cards";

const card = (rank, suit = "S") => ({ id: `1-${rank}${suit}`, rank, suit });

describe("a card's face", () => {
  test("one against one keeps the reference game's cards", () => {
    expect([1, 2, 13].map((rank) => faceOf(card(rank)))).toEqual(["out", "out", "sweep"]);
    expect([faceOf(card(11, "H")), faceOf(card(11, "S"))]).toEqual(["number", "swap"]);
    expect([faceOf(card(12, "H")), faceOf(card(12, "S"))]).toEqual(["take", "number"]);
  });

  test("two against two plays the basic cards", () => {
    expect(faceOf(card(1), "teams")).toBe("ace");
    expect(faceOf(card(2), "teams")).toBe("number");
    expect([faceOf(card(11, "H"), "teams"), faceOf(card(11, "S"), "teams")]).toEqual(["swap", "swap"]);
    expect([faceOf(card(12, "H"), "teams"), faceOf(card(12, "S"), "teams")]).toEqual(["number", "number"]);
    expect(faceOf(card(13), "teams")).toBe("bring");
  });

  test("the banner says what the card does in its own game", () => {
    expect(bannerOf(card(13))).toMatch(/13 steps/);
    expect(bannerOf(card(13), "teams")).toBe("Place a new marble");
    expect(bannerOf(card(10), "teams")).toMatch(/next player/);
  });
});
