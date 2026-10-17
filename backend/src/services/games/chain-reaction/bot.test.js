import { test } from "node:test";
import assert from "node:assert/strict";

import { botMove, DISTRACTED } from "#src/services/games/chain-reaction/bot.js";
import { legalCellsFor, setup } from "#src/services/games/chain-reaction/rules.js";

// the quick board is 5 wide and 7 tall, so its corners are these four
const CORNERS = [0, 4, 30, 34];
const ATTENTIVE = 0.99;
const DISTRACTED_ROLL = 0;

// a board mid-game, laid out cell by cell as [seat, orbs], with everyone already past their first move
const midGame = (layout) => {
  const state = setup(null, { size: "quick", players: 2 });
  const owners = [...state.owners];
  const orbs = [...state.orbs];
  Object.entries(layout).forEach(([cell, [seat, count]]) => {
    owners[cell] = seat;
    orbs[cell] = count;
  });
  return { ...state, owners, orbs, played: [true, true], turn: 0 };
};

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

const timesOver = (count, run) => Array.from({ length: count }, run);

test("a winning burst is always taken, even by a bot that is looking away", () => {
  const state = midGame({ 0: [0, 1], 1: [1, 1] });
  assert.equal(withLuck(DISTRACTED_ROLL, () => botMove(state, 0)), 0);
});

test("an attentive bot never places beside an enemy cell that is one orb from bursting, even on a corner it would like", () => {
  // the enemy edge cell beside corner 0 is one orb from bursting, so the corner the bot would otherwise favour is a trap
  const state = midGame({ 1: [1, 2], 17: [0, 1] });
  const picks = timesOver(40, () => withLuck(ATTENTIVE, () => botMove(state, 0)));
  assert.ok(picks.every((cell) => ![0, 2, 6].includes(cell)), `placed beside the full cell: ${picks}`);
});

test("an attentive bot takes the burst that captures the most", () => {
  const state = midGame({ 0: [0, 1], 1: [1, 1], 5: [1, 1], 34: [0, 1], 33: [1, 1], 17: [1, 1] });
  assert.equal(withLuck(ATTENTIVE, () => botMove(state, 0)), 0);
});

test("with nothing to take and nothing to avoid, an attentive bot opens in a corner", () => {
  const state = setup(null, { size: "quick", players: 2 });
  const picks = timesOver(20, () => withLuck(ATTENTIVE, () => botMove(state, 0)));
  assert.ok(picks.every((cell) => CORNERS.includes(cell)), `opened off the corners: ${picks}`);
});

test("a bot looking away still plays a legal cell, and a stand-in looks away more often than an opponent", () => {
  const state = midGame({ 0: [1, 1], 34: [0, 1] });
  const picks = timesOver(20, () => withLuck(DISTRACTED_ROLL, () => botMove(state, 0, "standIn")));
  assert.ok(picks.every((cell) => legalCellsFor(state, 0).includes(cell)));
  assert.ok(DISTRACTED.standIn > DISTRACTED.opponent);
});
