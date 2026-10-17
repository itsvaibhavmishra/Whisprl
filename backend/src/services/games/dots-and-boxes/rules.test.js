import { test } from "node:test";
import assert from "node:assert/strict";

import {
  boxesIn,
  linesIn,
  mostPlayersOn,
  outcome,
  play,
  scoresOf,
  setup,
  sidesOfBox,
  viewFor,
} from "#src/services/games/dots-and-boxes/rules.js";
import { PALETTE_SIZE } from "#src/services/games/colours.js";

const board = (size, players = 2) => setup(null, { size, players });

const draw = (state, ...lines) => lines.reduce((current, line) => play(current, current.turn, line), state);

const finished = (size, boxes, players = 2) => ({ size, players, lines: Array(linesIn(size)).fill(0), boxes, turn: 0, first: 0 });

test("a board of n boxes a side has n squared boxes and twice n times n plus one lines", () => {
  assert.deepEqual([3, 4, 5].map(boxesIn), [9, 16, 25]);
  assert.deepEqual([3, 4, 5].map(linesIn), [24, 40, 60]);
});

test("two boxes side by side share the line between them", () => {
  const [, , , right] = sidesOfBox(3, 0);
  const [, , left] = sidesOfBox(3, 1);
  assert.equal(right, left);
});

test("a board seats a player for every four boxes", () => {
  assert.deepEqual([3, 4, 5].map(mostPlayersOn), [2, 4, 6]);
});

test("a new board is empty, and the standard size is used when none is asked for", () => {
  const state = setup(null);
  assert.equal(state.size, 4);
  assert.equal(state.players, 2);
  assert.equal(state.lines.length, 40);
  assert.ok(state.lines.every((drawnBy) => drawnBy === null));
  assert.ok(state.boxes.every((owner) => owner === null));
});

test("a rematch gives the opening to the other seat", () => {
  const second = setup(board(5), { size: 5, players: 2 });
  assert.equal(second.first, 1);
  assert.equal(setup(second, { size: 5, players: 2 }).first, 0);
});

test("a board too small for the players is refused, as is a size that does not exist", () => {
  assert.throws(() => setup(null, { size: 6, players: 2 }), /does not exist/);
  assert.throws(() => setup(null, { size: 3, players: 3 }), /seats at most 2/);
  assert.throws(() => setup(null, { size: 4, players: 5 }), /seats at most 4/);
});

test("a line that does not exist, and one already drawn, are both refused", () => {
  const state = board(3);
  assert.throws(() => play(state, 0, 24), /does not exist/);
  assert.throws(() => play(state, 0, -1), /does not exist/);
  assert.throws(() => play(draw(state, 0), 1, 0), /already drawn/);
});

test("a line that closes nothing passes the turn on", () => {
  const state = draw(board(3), 0);
  assert.equal(state.turn, 1);
  assert.equal(state.lines[0], 0);
  assert.ok(state.boxes.every((owner) => owner === null));
});

test("closing a box claims it and earns another move", () => {
  const [top, bottom, left, right] = sidesOfBox(3, 0);
  const state = draw(board(3), top, bottom, left, right);
  assert.equal(state.boxes[0], 1, "the fourth side was drawn by seat 1");
  assert.equal(state.turn, 1, "so seat 1 moves again");
});

test("one line can close two boxes at once", () => {
  const [top, bottom, left, shared] = sidesOfBox(3, 0);
  const [nextTop, nextBottom, , nextRight] = sidesOfBox(3, 1);
  const state = draw(board(3), top, bottom, left, nextTop, nextBottom, nextRight, shared);
  assert.deepEqual([state.boxes[0], state.boxes[1]], [0, 0]);
  assert.deepEqual(scoresOf(state), [2, 0]);
});

test("a game is undecided until every line is drawn", () => {
  assert.equal(outcome(board(3)), null);
  assert.equal(outcome(draw(board(3), 0, 1, 2)), null);
});

test("the player holding the most boxes wins", () => {
  assert.deepEqual(outcome(finished(3, [0, 0, 0, 0, 0, 1, 1, 1, 1])).winners, [0]);
});

test("nobody holds the most when the leaders are level, which is a draw", () => {
  const evenly = [...Array(8).fill(0), ...Array(8).fill(1)];
  assert.deepEqual(outcome(finished(4, evenly)).winners, []);
  const twoAhead = [...Array(5).fill(0), ...Array(5).fill(1), ...Array(3).fill(2), ...Array(3).fill(3)];
  assert.deepEqual(outcome(finished(4, twoAhead, 4)).winners, []);
});

test("only the player to move is offered moves, and everyone sees the score", () => {
  const state = board(3);
  assert.equal(viewFor(state, 0).legalMoves.length, 24);
  assert.deepEqual(viewFor(state, 1).legalMoves, []);
  assert.deepEqual(viewFor(state, 1).scores, [0, 0]);
});

test("a finished board offers nobody a move", () => {
  assert.deepEqual(viewFor(finished(3, Array(9).fill(0)), 0).legalMoves, []);
});

test("every player gets a colour of their own", () => {
  const { colours } = setup(null, { size: 5, players: 6, seating: "a|b|c|d|e|f" });
  assert.equal(colours.length, 6);
  assert.equal(new Set(colours).size, 6, "no two players share one");
  assert.ok(colours.every((colour) => colour >= 0 && colour < PALETTE_SIZE));
});

test("a colour stays with its seat while the same people are sitting there", () => {
  const first = setup(null, { size: 4, players: 2, seating: "ava|ben" });
  const rematch = setup(first, { size: 4, players: 2, seating: "ava|ben" });
  assert.deepEqual(rematch.colours, first.colours);
});

test("someone new at the table deals the colours again", () => {
  const first = setup(null, { size: 4, players: 2, seating: "ava|ben" });
  const dealt = new Set(
    Array.from({ length: 60 }, () => String(setup(first, { size: 4, players: 2, seating: "ava|cleo" }).colours))
  );
  assert.ok(dealt.size > 1, `a changed table always dealt ${[...dealt]}`);
});
