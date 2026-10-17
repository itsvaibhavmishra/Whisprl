import { emptied, framesOf, neighboursOf } from "@/sections/chat/game/games/chain-reaction/cascade";

// a 3 by 3 board: corners have two neighbours, edges three, the middle four
const GRID = { width: 3, height: 3 };

const board = (layout) => {
  const owners = Array(9).fill(null);
  const orbs = Array(9).fill(0);
  Object.entries(layout).forEach(([cell, [seat, count]]) => {
    owners[cell] = seat;
    orbs[cell] = count;
  });
  return { ...GRID, owners, orbs };
};

test("a corner has two neighbours, an edge three and the middle four", () => {
  expect([0, 1, 4].map((cell) => neighboursOf(GRID, cell).length)).toEqual([2, 3, 4]);
});

test("a move that bursts nothing is one frame, the orb just placed", () => {
  const before = board({ 8: [1, 1] });
  const after = { ...board({ 0: [0, 1], 8: [1, 1] }), lastMove: { seat: 0, cell: 0 }, bursts: [] };
  expect(framesOf(before, after)).toHaveLength(1);
});

test("each round the server sent becomes a frame, ending on the board the server settled", () => {
  const before = board({ 0: [0, 1], 1: [0, 2], 8: [1, 1] });
  const after = { ...board({ 0: [0, 1], 2: [0, 1], 4: [0, 1], 3: [0, 1], 8: [1, 1] }), lastMove: { seat: 0, cell: 0 }, bursts: [[0], [1]] };
  const frames = framesOf(before, after);
  expect(frames).toHaveLength(3);
  expect(frames[2].orbs).toEqual(after.orbs);
});

test("orbs leave a bursting cell before they land, so the round starts with it emptied", () => {
  const placed = board({ 0: [0, 2] });
  expect(emptied(GRID, placed, [0]).orbs[0]).toBe(0);
  expect(emptied(GRID, placed, [0]).owners[0]).toBe(null);
});

test("a view that is not the next move after the last one is not animated, it is shown as it is", () => {
  const before = board({ 8: [1, 1] });
  const twoMovesLater = { ...board({ 0: [0, 1], 7: [1, 1], 8: [1, 1] }), lastMove: { seat: 1, cell: 7 }, bursts: [] };
  expect(framesOf(before, twoMovesLater)).toBe(null);
  expect(framesOf(null, twoMovesLater)).toBe(null);
});

test("a replay that would not end on the server's board is dropped rather than shown wrong", () => {
  const before = board({ 0: [0, 1], 8: [1, 1] });
  const tampered = { ...board({ 1: [0, 1], 3: [0, 1], 8: [1, 1], 4: [0, 0] }), lastMove: { seat: 0, cell: 0 }, bursts: [] };
  expect(framesOf(before, tampered)).toBe(null);
});
