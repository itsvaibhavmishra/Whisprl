import { test } from "node:test";
import assert from "node:assert/strict";

import { botMove, DISTRACTED } from "#src/services/games/dots-and-boxes/bot.js";
import { openLinesOf, outcome, play, scoresOf, setup, sidesOfBox } from "#src/services/games/dots-and-boxes/rules.js";

const board = (size, players = 2) => setup(null, { size, players });

const draw = (state, ...lines) => lines.reduce((current, line) => play(current, current.turn, line), state);

// every move here gives boxes away, and they are not worth the same: the cheapest hands over one
const FORCED = [0, 1, 2, 4, 6, 10, 11, 12, 15, 17, 19, 21, 23];
const CHEAPEST = [9, 20];

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

const everyChoiceOn = (state) => over200(() => withLuck(PAYING_ATTENTION, () => botMove(state)));

test("a box with three sides is taken", () => {
  const [top, bottom, left, right] = sidesOfBox(3, 0);
  assert.deepEqual(everyChoiceOn(draw(board(3), top, bottom, left)), new Set([right]));
});

test("no box is left on three sides while a line that gives nothing away is free", () => {
  const [top, , left] = sidesOfBox(3, 0);
  const gifts = [sidesOfBox(3, 0)[1], sidesOfBox(3, 0)[3]];
  const chosen = everyChoiceOn(draw(board(3), top, left));
  assert.ok(gifts.every((gift) => !chosen.has(gift)), `chose a gift from ${[...chosen]}`);
});

test("when every line gives something away, the smallest chain is opened", () => {
  const forced = draw(board(3), ...FORCED);
  assert.deepEqual([...everyChoiceOn(forced)].sort((one, other) => one - other), CHEAPEST);
});

test("two bots finish a game, and every box ends up claimed", () => {
  let state = board(4);
  while (!outcome(state)) state = play(state, state.turn, botMove(state));
  assert.equal(openLinesOf(state).length, 0);
  assert.ok(state.boxes.every((owner) => owner !== null));
  assert.equal(
    scoresOf(state).reduce((total, score) => total + score, 0),
    16
  );
});

test("a free box is taken even by a bot that is looking away", () => {
  const [top, bottom, left, right] = sidesOfBox(3, 0);
  const state = draw(board(3), top, bottom, left);
  assert.equal(withLuck(0, () => botMove(state)), right);
});

test("looking away, it sometimes hands a box over instead of playing safe", () => {
  const [top, , left] = sidesOfBox(3, 0);
  const state = draw(board(3), top, left);
  const gifts = [sidesOfBox(3, 0)[1], sidesOfBox(3, 0)[3]];
  const chosen = over200(() => withLuck(LOOKING_AWAY, () => botMove(state)));
  assert.ok(gifts.some((gift) => chosen.has(gift)), `never gave one away in 200 tries: ${[...chosen]}`);
});

test("the bot standing in for someone who left is the weaker of the two", () => {
  assert.ok(DISTRACTED.standIn > DISTRACTED.opponent);
});
