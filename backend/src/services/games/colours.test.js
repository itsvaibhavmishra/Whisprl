import { test } from "node:test";
import assert from "node:assert/strict";

import { dealtColours, PALETTE_SIZE } from "#src/services/games/colours.js";

const gapBetween = (one, other) => Math.min(Math.abs(one - other), PALETTE_SIZE - Math.abs(one - other));

test("two players are dealt colours from opposite sides of the palette, never neighbours", () => {
  for (let deal = 0; deal < 50; deal += 1) {
    const [first, second] = dealtColours(2);
    assert.equal(gapBetween(first, second), 3);
  }
});

test("three players are dealt every other colour", () => {
  for (let deal = 0; deal < 50; deal += 1) {
    const colours = dealtColours(3);
    assert.ok(colours.every((colour, seat) => gapBetween(colour, colours[(seat + 1) % 3]) === 2));
  }
});

test("every table up to six gets distinct colours from the palette, and which ones is left to chance", () => {
  for (let players = 2; players <= 6; players += 1) {
    const colours = dealtColours(players);
    assert.equal(new Set(colours).size, players);
    assert.ok(colours.every((colour) => colour >= 0 && colour < PALETTE_SIZE));
  }
  const starts = new Set(Array.from({ length: 200 }, () => dealtColours(2)[0]));
  assert.equal(starts.size, PALETTE_SIZE);
});
