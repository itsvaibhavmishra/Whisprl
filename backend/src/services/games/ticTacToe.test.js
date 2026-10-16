import { test } from "node:test";
import assert from "node:assert/strict";

import ticTacToe from "#src/services/games/ticTacToe.js";

const CROSS = 0;
const NOUGHT = 1;
const BLANK = null;

const playedOut = (moves) => moves.reduce((state, cell) => ticTacToe.play(state, state.turn, cell), ticTacToe.setup());

test("X moves first, and turns alternate", () => {
  const state = playedOut([4]);
  assert.equal(state.board[4], CROSS);
  assert.equal(ticTacToe.turnOf(state), NOUGHT);
});

test("a taken square and one off the board are refused", () => {
  const state = playedOut([4]);
  assert.throws(() => ticTacToe.play(state, NOUGHT, 4), /taken/);
  assert.throws(() => ticTacToe.play(state, NOUGHT, 9), /does not exist/);
  assert.throws(() => ticTacToe.play(state, NOUGHT, "3"), /does not exist/);
});

test("three in a row wins, and a full board without one is a draw", () => {
  assert.deepEqual(ticTacToe.outcome(playedOut([0, 3, 1, 4, 2])), { winners: [CROSS] });
  assert.deepEqual(ticTacToe.outcome(playedOut([0, 1, 2, 4, 3, 5, 7, 6, 8])), { winners: [] });
  assert.equal(ticTacToe.outcome(playedOut([0, 1])), null);
});

test("only the player to move is offered moves, and none once the game is won", () => {
  const state = playedOut([4]);
  assert.deepEqual(ticTacToe.viewFor(state, CROSS).legalMoves, []);
  assert.equal(ticTacToe.viewFor(state, NOUGHT).legalMoves.length, 8);
  const won = playedOut([0, 3, 1, 4, 2]);
  assert.deepEqual(ticTacToe.viewFor(won, NOUGHT).legalMoves, []);
  assert.deepEqual(ticTacToe.viewFor(won, -1).line, [0, 1, 2]);
});

test("the bot takes a win before it blocks one", () => {
  const board = [NOUGHT, NOUGHT, BLANK, CROSS, CROSS, BLANK, CROSS, BLANK, BLANK];
  assert.equal(ticTacToe.botMove({ board, turn: NOUGHT }, NOUGHT), 2);
});

test("the bot blocks a line it cannot win", () => {
  const board = [CROSS, CROSS, BLANK, BLANK, NOUGHT, BLANK, BLANK, BLANK, BLANK];
  assert.equal(ticTacToe.botMove({ board, turn: NOUGHT }, NOUGHT), 2);
});

test("the bot opens in the centre and always picks a free square", () => {
  assert.equal(ticTacToe.botMove(ticTacToe.setup(), CROSS), 4);
  const board = [CROSS, NOUGHT, CROSS, CROSS, NOUGHT, NOUGHT, NOUGHT, CROSS, BLANK];
  assert.equal(ticTacToe.botMove({ board, turn: CROSS }, CROSS), 8);
});

test("each rematch is opened by the seat that went second last time", () => {
  const first = ticTacToe.setup();
  assert.equal(ticTacToe.turnOf(first), CROSS);
  const second = ticTacToe.setup(playedOut([4, 0]));
  assert.equal(ticTacToe.turnOf(second), NOUGHT);
  assert.equal(ticTacToe.turnOf(ticTacToe.setup(second)), CROSS);
});
