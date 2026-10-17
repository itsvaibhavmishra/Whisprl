import { test } from "node:test";
import assert from "node:assert/strict";

import { botMove, DISTRACTED } from "#src/services/games/tic-tac-toe/bot.js";
import { setup } from "#src/services/games/tic-tac-toe/rules.js";

const CROSS = 0;
const NOUGHT = 1;
const BLANK = null;

// only the roll deciding whether the bot looks away is fixed, so its pick among equal moves stays random
const withLuck = (roll, run) => {
  const real = Math.random;
  let spent = false;
  Math.random = () => {
    if (spent) return real();
    spent = true;
    return roll;
  };
  try {
    return run();
  } finally {
    Math.random = real;
  }
};

const PAYING_ATTENTION = 0.99;
const LOOKING_AWAY = 0;

const over200 = (make) => new Set(Array.from({ length: 200 }, make));

test("a free win is taken even by a bot that is looking away", () => {
  const board = [NOUGHT, NOUGHT, BLANK, CROSS, CROSS, BLANK, CROSS, BLANK, BLANK];
  assert.equal(withLuck(LOOKING_AWAY, () => botMove({ board }, NOUGHT)), 2);
  assert.equal(withLuck(PAYING_ATTENTION, () => botMove({ board }, NOUGHT)), 2);
});

test("a line it cannot win is blocked, while it is paying attention", () => {
  const board = [CROSS, CROSS, BLANK, BLANK, NOUGHT, BLANK, BLANK, BLANK, BLANK];
  assert.deepEqual(over200(() => withLuck(PAYING_ATTENTION, () => botMove({ board }, NOUGHT))), new Set([2]));
});

test("looking away, it does not always find that block", () => {
  const board = [CROSS, CROSS, BLANK, BLANK, NOUGHT, BLANK, BLANK, BLANK, BLANK];
  const chosen = over200(() => withLuck(LOOKING_AWAY, () => botMove({ board }, NOUGHT)));
  assert.ok(chosen.size > 1, `a bot looking away always played ${[...chosen]}`);
});

test("it opens in the centre, and takes the last square when that is all there is", () => {
  assert.equal(withLuck(PAYING_ATTENTION, () => botMove(setup(), CROSS)), 4);
  const board = [CROSS, NOUGHT, CROSS, CROSS, NOUGHT, NOUGHT, NOUGHT, CROSS, BLANK];
  assert.equal(withLuck(LOOKING_AWAY, () => botMove({ board }, CROSS)), 8);
});

test("the bot standing in for someone who left is the weaker of the two", () => {
  assert.ok(DISTRACTED.standIn > DISTRACTED.opponent);
});
