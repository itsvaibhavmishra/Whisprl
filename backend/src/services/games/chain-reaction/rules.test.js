import { test } from "node:test";
import assert from "node:assert/strict";

import {
  assertOptions,
  cellsIn,
  criticalMassOf,
  isOut,
  legalCellsFor,
  mostPlayersOn,
  outcome,
  play,
  setup,
  SIZES,
  viewFor,
} from "#src/services/games/chain-reaction/rules.js";

const QUICK = SIZES.quick;
const LAST_CELL = cellsIn(QUICK) - 1;

const board = (players = 2) => setup(null, { size: "quick", players });

const place = (state, ...cells) => cells.reduce((current, cell) => play(current, current.turn, cell), state);

// a board mid-game, laid out cell by cell as [seat, orbs], with everyone already past their first move
const midGame = (layout, { players = 2, turn = 0 } = {}) => {
  const state = board(players);
  const owners = [...state.owners];
  const orbs = [...state.orbs];
  Object.entries(layout).forEach(([cell, [seat, count]]) => {
    owners[cell] = seat;
    orbs[cell] = count;
  });
  return { ...state, owners, orbs, played: Array(players).fill(true), turn };
};

const totalOrbs = (state) => state.orbs.reduce((sum, count) => sum + count, 0);

test("the three boards are 5 by 7, 6 by 9 and 7 by 11, each seating a player for every ten cells", () => {
  assert.deepEqual(Object.values(SIZES).map(cellsIn), [35, 54, 77]);
  assert.deepEqual(Object.keys(SIZES).map(mostPlayersOn), [3, 5, 7]);
});

test("a cell bursts at its neighbour count: two in a corner, three on an edge, four inside", () => {
  assert.equal(criticalMassOf(QUICK, 0), 2);
  assert.equal(criticalMassOf(QUICK, 2), 3);
  assert.equal(criticalMassOf(QUICK, 12), 4);
  assert.equal(criticalMassOf(QUICK, LAST_CELL), 2);
});

test("a new board is empty and nobody has played, and the standard size is used when none is asked for", () => {
  const state = setup(null);
  assert.equal(state.size, "standard");
  assert.equal(cellsIn(state), 54);
  assert.ok(state.owners.every((owner) => owner === null));
  assert.deepEqual(state.played, [false, false]);
});

test("an unknown size, or more players than a board seats, is refused", () => {
  assert.throws(() => assertOptions({ size: "huge", players: 2 }));
  assert.throws(() => assertOptions({ size: "quick", players: 4 }));
  assert.doesNotThrow(() => assertOptions({ size: "long", players: 6 }));
});

test("an orb goes on an empty cell or one of your own, never on someone else's", () => {
  const state = place(board(), 0, LAST_CELL);
  assert.throws(() => play(state, 0, LAST_CELL), /belongs to someone else/);
  assert.doesNotThrow(() => play(state, 0, 0));
  assert.doesNotThrow(() => play(state, 0, 6));
  assert.ok(!legalCellsFor(state, 0).includes(LAST_CELL));
});

test("nobody is out before their first move, so the second player is not knocked out by holding nothing", () => {
  const state = place(board(), 0);
  assert.equal(isOut(state, 1), false);
  assert.equal(state.turn, 1);
  assert.equal(outcome(state), null);
});

test("a full corner bursts, sending one orb to each neighbour and turning them its colour", () => {
  const state = place(board(), 0, LAST_CELL, 0);
  assert.equal(state.orbs[0], 0);
  assert.equal(state.owners[0], null);
  assert.deepEqual([state.owners[1], state.orbs[1]], [0, 1]);
  assert.deepEqual([state.owners[5], state.orbs[5]], [0, 1]);
  assert.deepEqual(state.bursts, [[0]]);
});

test("a burst that fills a neighbour sets off the next round, and each round is recorded for the client to replay", () => {
  const state = midGame({ 0: [0, 1], 1: [0, 2], [LAST_CELL]: [1, 1] });
  const after = play(state, 0, 0);
  assert.deepEqual(after.bursts, [[0], [1]]);
  assert.deepEqual([0, 2, 6].map((cell) => after.owners[cell]), [0, 0, 0]);
});

test("a burst converts every neighbour it lands on, whoever held it", () => {
  const state = midGame({ 0: [0, 1], 1: [1, 1], [LAST_CELL]: [1, 1] });
  const after = play(state, 0, 0);
  assert.deepEqual([after.owners[1], after.orbs[1]], [0, 2]);
});

test("a player left holding nothing is out, and the turn passes over them", () => {
  const state = midGame({ 0: [0, 1], 1: [2, 1], [LAST_CELL]: [1, 1] }, { players: 3 });
  const after = play(state, 0, 0);
  assert.equal(isOut(after, 2), true);
  assert.equal(after.turn, 1);
  assert.equal(play(after, 1, LAST_CELL).turn, 0);
});

test("the last player holding orbs wins, and a game is never drawn", () => {
  const state = midGame({ 0: [0, 1], 1: [1, 1] });
  assert.deepEqual(outcome(play(state, 0, 0)), { winners: [0] });
});

test("a cascade stops once one colour holds the board, rather than bursting forever", () => {
  const layout = {};
  for (let cell = 0; cell < cellsIn(QUICK); cell += 1) layout[cell] = [0, criticalMassOf(QUICK, cell) - 1];
  layout[LAST_CELL] = [1, 1];
  const after = play(midGame(layout), 0, LAST_CELL - 1);
  assert.deepEqual(outcome(after), { winners: [0] });
  assert.ok(after.bursts.length < 1000);
});

test("a rematch gives the opening to the next seat", () => {
  const first = board();
  assert.equal(setup(first, { size: "quick", players: 2 }).turn, 1);
});

test("only the player to move is offered moves, and the view says who is out", () => {
  const state = place(board(), 0);
  assert.deepEqual(viewFor(state, 0).legalMoves, []);
  assert.ok(viewFor(state, 1).legalMoves.length > 0);
  assert.deepEqual(viewFor(state, 0).out, [false, false]);
});

test("random games always end with one winner, and no orb is ever made or lost", () => {
  for (let game = 0; game < 40; game += 1) {
    let state = setup(null, { size: "quick", players: 2 + (game % 2) });
    let moves = 0;
    while (!outcome(state)) {
      const choices = legalCellsFor(state, state.turn);
      state = play(state, state.turn, choices[Math.floor(Math.random() * choices.length)]);
      moves += 1;
      assert.equal(totalOrbs(state), moves);
      assert.ok(moves < 2000, "a game that never ends");
    }
    assert.equal(outcome(state).winners.length, 1);
  }
});
