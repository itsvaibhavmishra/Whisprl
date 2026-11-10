import { test } from "node:test";
import assert from "node:assert/strict";

import { MEDIUM_SKILL, levelAt, recentAfter, skillAfter, skillForGame, skillOf } from "#src/services/games/botLevels.js";

const always = (value) => () => value;

test("each move is played by one of the two levels either side of the skill, the nearer more often", () => {
  assert.equal(levelAt(0, always(0.99)), "dumb");
  assert.equal(levelAt(100, always(0)), "expert");
  assert.equal(levelAt(50, always(0.4)), "pro");
  assert.equal(levelAt(50, always(0.6)), "medium");
  assert.equal(levelAt(MEDIUM_SKILL, always(0.99)), "medium");
});

test("a newcomer moves in big steps and a regular in small ones, a loss further than a win, and a draw eases it a touch", () => {
  assert.equal(skillAfter({ skill: 50, played: 2 }, "won"), 60);
  assert.equal(skillAfter({ skill: 50, played: 2 }, "lost"), 35);
  assert.equal(skillAfter({ skill: 50, played: 20 }, "won"), 54);
  assert.equal(skillAfter({ skill: 50, played: 20 }, "lost"), 44);
  assert.equal(skillAfter({ skill: 50, played: 20 }, "drawn"), 48);
});

test("a skill never leaves 0 to 100", () => {
  assert.equal(skillAfter({ skill: 99, played: 1 }, "won"), 100);
  assert.equal(skillAfter({ skill: 3, played: 1 }, "lost"), 0);
});

test("one loss at the top only nudges the bot, so it never drops a level after every loss", () => {
  const afterLoss = skillAfter({ skill: 100, played: 30 }, "lost");
  assert.equal(afterLoss, 94);
  assert.equal(levelAt(afterLoss, always(0.5)), "expert");
});

test("a game is a little easier after two losses and a little harder after three wins, and now and then a notch off", () => {
  const noSurprise = always(0.99);
  assert.equal(skillForGame({ skill: 50, recent: ["won", "lost", "lost"] }, noSurprise), 40);
  assert.equal(skillForGame({ skill: 50, recent: ["won", "won", "won"] }, noSurprise), 60);
  assert.equal(skillForGame({ skill: 50, recent: ["lost", "won"] }, noSurprise), 50);
  assert.equal(skillForGame({ skill: 50, recent: [] }, always(0)), 62);
});

test("only the last three results are kept", () => {
  assert.deepEqual(recentAfter({ recent: ["won", "won", "lost"] }, "drawn"), ["won", "lost", "drawn"]);
  assert.deepEqual(recentAfter(undefined, "won"), ["won"]);
});

test("a record with no skill yet starts a regular at medium and anyone newer at the bottom", () => {
  assert.equal(skillOf({ played: 6 }), MEDIUM_SKILL);
  assert.equal(skillOf({ played: 1 }), 0);
  assert.equal(skillOf(), 0);
  assert.equal(skillOf({ skill: 70, played: 50 }), 70);
});
