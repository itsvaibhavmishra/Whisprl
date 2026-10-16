import { test } from "node:test";
import assert from "node:assert/strict";

import { botMove } from "#src/services/games/tic-tac-toe/bot.js";
import { setup } from "#src/services/games/tic-tac-toe/rules.js";

const CROSS = 0;
const NOUGHT = 1;
const BLANK = null;

test("the bot takes a win before it blocks one", () => {
  const board = [NOUGHT, NOUGHT, BLANK, CROSS, CROSS, BLANK, CROSS, BLANK, BLANK];
  assert.equal(botMove({ board, turn: NOUGHT }, NOUGHT), 2);
});

test("the bot blocks a line it cannot win", () => {
  const board = [CROSS, CROSS, BLANK, BLANK, NOUGHT, BLANK, BLANK, BLANK, BLANK];
  assert.equal(botMove({ board, turn: NOUGHT }, NOUGHT), 2);
});

test("the bot opens in the centre and always picks a free square", () => {
  assert.equal(botMove(setup(), CROSS), 4);
  const board = [CROSS, NOUGHT, CROSS, CROSS, NOUGHT, NOUGHT, NOUGHT, CROSS, BLANK];
  assert.equal(botMove({ board, turn: CROSS }, CROSS), 8);
});
