import { test } from "node:test";
import assert from "node:assert/strict";

import { levelFor } from "#src/services/games/botLevels.js";

const levelsOfFirst = (count) => Array.from({ length: count }, (_, played) => levelFor({ played, recent: [] }));

test("a newcomer meets a dumb bot twice, then the expert, then a dumb bot again", () => {
  assert.deepEqual(levelsOfFirst(4), ["dumb", "dumb", "expert", "dumb"]);
  assert.equal(levelFor(), "dumb");
});

test("after that the bot is medium, dropping to dumb after two losses and rising to pro after two wins", () => {
  assert.equal(levelFor({ played: 4, recent: ["won", "lost"] }), "medium");
  assert.equal(levelFor({ played: 6, recent: ["lost", "lost"] }), "dumb");
  assert.equal(levelFor({ played: 7, recent: ["won", "won"] }), "pro");
  assert.equal(levelFor({ played: 8, recent: ["drawn", "won"] }), "medium");
});

test("every fifth game from the tenth is the expert again, whatever the recent results", () => {
  [9, 14, 19].forEach((played) => assert.equal(levelFor({ played, recent: ["lost", "lost"] }), "expert"));
  assert.notEqual(levelFor({ played: 4, recent: [] }), "expert");
});
