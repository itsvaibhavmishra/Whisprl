import { test } from "node:test";
import assert from "node:assert/strict";

import { playsForTurn } from "#src/services/games/jackaroo/moves.js";

const base = (slot) => ({ at: "base", slot });
const track = (index) => ({ at: "track", index });
const home = (slot) => ({ at: "home", slot });
const card = (rank, suit = "S") => ({ id: `1-${rank}${suit}`, rank, suit });

// a board laid out by hand: seat 0's marbles, seat 1's marbles, and seat 0's hand
export const boardWith = ({ mine = [], theirs = [], hand = [], theirHand = [card(3, "C")] }) => {
  const marbles = (places) => [0, 1, 2, 3].map((slot) => places[slot] ?? base(slot));
  return {
    players: [
      { hand, marbles: marbles(mine) },
      { hand: theirHand, marbles: marbles(theirs) },
    ],
    pending: null,
  };
};

const playsOf = (state, kind) => playsForTurn(state, 0).filter((play) => play.kind === kind);
const endsOf = (plays) => plays.map((play) => play.moves.at(-1).to);

test("an ace or a two brings a marble out, but not onto your own marble", () => {
  assert.deepEqual(endsOf(playsOf(boardWith({ hand: [card(1)] }), "out")), [track(0)]);
  assert.deepEqual(endsOf(playsOf(boardWith({ hand: [card(2)] }), "out")), [track(0)]);
  assert.equal(playsOf(boardWith({ mine: [track(0)], hand: [card(1)] }), "out").length, 0);
});

test("bringing a marble out knocks out a rival sitting on your start", () => {
  const [play] = playsOf(boardWith({ theirs: [track(0)], hand: [card(13)] }), "out");
  assert.deepEqual(play.moves[0].captured[0].marble, { owner: 1, id: 0 });
});

test("a marble jumps one marble in a move, its own too, but never two, and never lands on its own", () => {
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(3), track(5)], hand: [card(3)] }), "move")), [track(6), track(8)]);
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(3), track(4)], theirs: [track(5)], hand: [card(3)] }), "move")), [track(7)]);
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(3), track(5)], hand: [card(2)] }), "move")), [track(7)]);
});

test("landing on a rival knocks it back to its base, passing one does not", () => {
  const [play] = playsOf(boardWith({ mine: [track(3)], theirs: [track(5), track(6)], hand: [card(3)] }), "move");
  assert.deepEqual(
    play.moves[0].captured.map(({ marble }) => marble),
    [{ owner: 1, id: 1 }]
  );
});

test("nobody passes or lands on a marble sitting on its own start", () => {
  assert.equal(playsOf(boardWith({ mine: [track(22)], theirs: [track(24)], hand: [card(3)] }), "move").length, 0);
  assert.equal(playsOf(boardWith({ mine: [track(21)], theirs: [track(24)], hand: [card(3)] }), "move").length, 0);
});

test("a marble turns into home when the rest of its move fits", () => {
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(44)], hand: [card(3)] }), "move")), [home(0)]);
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(46)], hand: [card(3)] }), "move")), [home(2)]);
});

test("nobody runs past their own home, so a move too long for it cannot be made", () => {
  assert.equal(playsOf(boardWith({ mine: [track(44)], hand: [card(8)] }), "move").length, 0);
  assert.equal(playsOf(boardWith({ mine: [track(41), home(3)], hand: [card(9)] }), "move").length, 0);
});

test("a king's thirteen cannot run past home either, but turns into it on an exact count", () => {
  assert.equal(playsOf(boardWith({ mine: [track(40)], hand: [card(13)] }), "sweep").length, 0);
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(37)], theirs: [track(40)], hand: [card(13)] }), "sweep")), [home(3)]);
});

test("a marble parked in front of home is jumped on the way in like any other, but two are not", () => {
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(44)], theirs: [track(46)], hand: [card(3)] }), "move")), [home(0)]);
  assert.equal(playsOf(boardWith({ mine: [track(44)], theirs: [track(45), track(46)], hand: [card(3)] }), "move").length, 0);
});

test("a marble in home moves on only by an exact count, and never past its own", () => {
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [home(1)], hand: [card(2)] }), "move")), [home(3)]);
  assert.equal(playsOf(boardWith({ mine: [home(1)], hand: [card(3)] }), "move").length, 0);
  assert.equal(playsOf(boardWith({ mine: [home(0), home(2)], hand: [card(3)] }), "move").length, 0);
});

test("a four goes back, even off the start, and never into a home", () => {
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(0)], hand: [card(4)] }), "back")), [track(44)]);
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(24)], hand: [card(4)] }), "back")), [track(20)]);
});

test("landing exactly on a swirl jumps to its twin, and passing one does not", () => {
  const [jump] = playsOf(boardWith({ mine: [track(13)], hand: [card(3)] }), "move");
  assert.deepEqual(jump.moves[0].to, track(28));
  assert.deepEqual(jump.moves[0].teleport.from, track(16));
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(13)], hand: [card(6)] }), "move")), [track(19)]);
});

test("a four going back onto a swirl jumps across too", () => {
  const [back] = playsOf(boardWith({ mine: [track(44)], hand: [card(4)] }), "back");
  assert.deepEqual(back.moves[0].to, track(4));
  assert.deepEqual(back.moves[0].teleport.from, track(40));
});

test("a swirl jumps any marble across, even one it carries past its own home", () => {
  const [own] = playsOf(boardWith({ mine: [track(37)], hand: [card(3)] }), "move");
  assert.deepEqual(own.moves[0].to, track(4));
  const [pushed] = playsOf(boardWith({ theirs: [track(11)], hand: [card(5)] }), "move");
  assert.deepEqual(pushed.moves[0].to, track(28));
});

test("a jump onto a rival knocks it out, and one onto your own marble cannot be made", () => {
  const [onRival] = playsOf(boardWith({ mine: [track(13)], theirs: [track(28)], hand: [card(3)] }), "move");
  assert.deepEqual(onRival.moves[0].captured.at(-1).marble, { owner: 1, id: 0 });
  const onOwn = playsOf(boardWith({ mine: [track(13), track(28)], hand: [card(3)] }), "move").find((play) => play.moves[0].marble.id === 0);
  assert.equal(onOwn, undefined);
});

test("a king's thirteen knocks out every marble it passes, your own too", () => {
  const state = boardWith({ mine: [track(6), track(8)], theirs: [track(10), track(19)], hand: [card(13)] });
  const sweep = playsOf(state, "sweep").find((play) => play.moves[0].marble.id === 0);
  assert.deepEqual(
    sweep.moves[0].captured.map(({ marble }) => marble),
    [
      { owner: 0, id: 1 },
      { owner: 1, id: 0 },
      { owner: 1, id: 1 },
    ]
  );
  assert.deepEqual(sweep.moves[0].to, track(19));
});

test("a five moves a rival's marble, which runs past its own home", () => {
  const [play] = playsOf(boardWith({ theirs: [track(20)], hand: [card(5)] }), "move");
  assert.deepEqual(play.moves[0].to, track(25));
});

test("a five cannot touch a rival's marble sitting on its own start, but can move your own off yours", () => {
  assert.equal(playsOf(boardWith({ theirs: [track(24)], hand: [card(5)] }), "move").length, 0);
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(0)], hand: [card(5)] }), "move")), [track(5)]);
});

test("a seven can be split between two marbles, each part landing on its own", () => {
  const split = playsOf(boardWith({ mine: [track(5), track(20)], hand: [card(7)] }), "split").find((play) => play.moves[0].path.length === 3);
  assert.deepEqual(
    split.moves.map((move) => move.to),
    [track(8), track(24)]
  );
});

test("a black jack swaps your marble, even one on your start, but never theirs off its own start", () => {
  const state = boardWith({ mine: [track(0), track(9)], theirs: [track(24), track(38)], hand: [card(11)] });
  assert.deepEqual(
    playsOf(state, "swap").map((play) => play.swap),
    [
      [
        { owner: 0, id: 0 },
        { owner: 1, id: 1 },
      ],
      [
        { owner: 0, id: 1 },
        { owner: 1, id: 1 },
      ],
    ]
  );
});

test("red cards do different things from black ones in a one against one game", () => {
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(4)], hand: [card(11, "H")] }), "move")), [track(15)]);
  assert.equal(playsOf(boardWith({ hand: [card(12, "D")] }), "takeCard").length, 1);
  assert.deepEqual(endsOf(playsOf(boardWith({ mine: [track(5)], hand: [card(12)] }), "move")), [track(17)]);
});

const kindsOf = (state) => playsForTurn(state, 0).map((play) => play.kind);

test("stuck behind a rival on its start, one card goes a turn, since the rival may move away", () => {
  assert.deepEqual(kindsOf(boardWith({ mine: [track(21)], theirs: [track(24)], hand: [card(3), card(9)] })), ["discard", "discard"]);
});

test("the whole hand goes at once when nothing can change this round", () => {
  assert.deepEqual(kindsOf(boardWith({ mine: [home(3), home(2)], hand: [card(4), card(3)] })), ["discardAll"]);
  assert.deepEqual(kindsOf(boardWith({ mine: [track(21)], theirs: [track(24)], hand: [card(3)], theirHand: [] })), ["discardAll"]);
});
