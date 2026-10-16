import { test } from "node:test";
import assert from "node:assert/strict";

import { outcome, play, setup, turnOf, viewFor } from "#src/services/games/tic-tac-toe/rules.js";

const CROSS = 0;
const NOUGHT = 1;

const playedOut = (moves) => moves.reduce((state, cell) => play(state, turnOf(state), cell), setup());

test("X moves first, and turns alternate", () => {
  const state = playedOut([4]);
  assert.equal(state.board[4], CROSS);
  assert.equal(turnOf(state), NOUGHT);
});

test("a taken square and one off the board are refused", () => {
  const state = playedOut([4]);
  assert.throws(() => play(state, NOUGHT, 4), /taken/);
  assert.throws(() => play(state, NOUGHT, 9), /does not exist/);
  assert.throws(() => play(state, NOUGHT, "3"), /does not exist/);
});

test("three in a row wins, and a full board without one is a draw", () => {
  assert.deepEqual(outcome(playedOut([0, 3, 1, 4, 2])), { winners: [CROSS] });
  assert.deepEqual(outcome(playedOut([0, 1, 2, 4, 3, 5, 7, 6, 8])), { winners: [] });
  assert.equal(outcome(playedOut([0, 1])), null);
});

test("only the player to move is offered moves, and none once the game is won", () => {
  const state = playedOut([4]);
  assert.deepEqual(viewFor(state, CROSS).legalMoves, []);
  assert.equal(viewFor(state, NOUGHT).legalMoves.length, 8);
  const won = playedOut([0, 3, 1, 4, 2]);
  assert.deepEqual(viewFor(won, NOUGHT).legalMoves, []);
  assert.deepEqual(viewFor(won, -1).line, [0, 1, 2]);
});

test("each rematch is opened by the seat that went second last time", () => {
  const first = setup();
  assert.equal(turnOf(first), CROSS);
  const second = setup(playedOut([4, 0]));
  assert.equal(turnOf(second), NOUGHT);
  assert.equal(turnOf(setup(second)), CROSS);
});
