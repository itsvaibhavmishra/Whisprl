import { test } from "node:test";
import assert from "node:assert/strict";

import { outcome, play, setup, turnOf, viewFor } from "#src/services/games/jackaroo/rules.js";

const track = (index) => ({ at: "track", index });
const home = (slot) => ({ at: "home", slot });
const card = (rank, suit = "S") => ({ id: `9-${rank}${suit}`, rank, suit });

// a fresh game with the board and both hands laid out by hand, seat 0 to move
const gameWith = ({ mine = [], theirs = [], hand, theirHand }) => {
  const state = setup(null, { players: 2 });
  const place = (places) => [0, 1, 2, 3].map((slot) => places[slot] ?? { at: "base", slot });
  state.players[0] = { hand, marbles: place(mine) };
  state.players[1] = { hand: theirHand, marbles: place(theirs) };
  return { ...state, turn: 0, leader: 0 };
};

const optionOf = (state, kind, cardRank) => viewFor(state, turnOf(state)).options.find((option) => option.kind === kind && (!cardRank || option.card.endsWith(`-${cardRank}S`)));

test("a new game deals four cards each, deals out the colours and starts one marble each on its start", () => {
  const state = setup(null, { players: 2, seating: "a|b" });
  assert.deepEqual(
    state.players.map(({ hand }) => hand.length),
    [4, 4]
  );
  assert.equal(state.colours.length, 2);
  assert.ok([0, 1].includes(turnOf(state)));
  assert.deepEqual(
    state.players.map(({ marbles }) => marbles.filter((place) => place.at === "track")),
    [[track(0)], [track(24)]]
  );
});

test("the opener alternates from one game to the next", () => {
  const first = setup(null, { players: 2 });
  assert.equal(setup(first, { players: 2 }).first, 1 - first.first);
});

test("everyone sees the board and how many cards each player holds, but only their own hand", () => {
  const state = gameWith({ hand: [card(3), card(9)], theirHand: [card(5)] });
  const mine = viewFor(state, 0);
  const theirs = viewFor(state, 1);
  const watching = viewFor(state, -1);
  assert.deepEqual(mine.hand, [card(3), card(9)]);
  assert.deepEqual(theirs.hand, [card(5)]);
  assert.deepEqual(watching.hand, []);
  assert.deepEqual(watching.hands, [2, 1]);
  assert.equal(watching.shoe, undefined);
  assert.ok(mine.options.length > 0);
  assert.equal(theirs.options.length, 0);
});

test("each move offered carries its path, its steps and whom it would knock out", () => {
  const state = gameWith({ mine: [track(3)], theirs: [track(6)], hand: [card(3)], theirHand: [card(5)] });
  const [move] = optionOf(state, "move", 3).moves;
  assert.deepEqual(move.path, [track(4), track(5), track(6)]);
  assert.equal(move.steps, 3);
  assert.deepEqual(move.captured, [{ owner: 1, id: 0 }]);
});

test("a play the view did not offer is refused", () => {
  const state = gameWith({ hand: [card(3)], theirHand: [card(5)] });
  assert.throws(() => play(state, 0, { key: "9-3S:move:0.0>t3" }), /not allowed/);
  assert.throws(() => play(state, 0, null), /not allowed/);
});

test("playing a card moves the marble, puts the card on the pile and passes the turn", () => {
  const state = gameWith({ mine: [track(3)], hand: [card(3), card(9)], theirHand: [card(5)] });
  const after = play(state, 0, { key: optionOf(state, "move", 3).key });
  assert.deepEqual(after.players[0].marbles[0], track(6));
  assert.deepEqual(after.pile.at(-1), { card: card(3), seat: 0, thrown: false, round: 1 });
  assert.equal(turnOf(after), 1);
  assert.equal(after.lastPlay.moves[0].path.length, 3);
});

test("knocking out a rival earns one more card and keeps the turn", () => {
  const state = gameWith({ mine: [track(3)], theirs: [track(6)], hand: [card(3)], theirHand: [card(5)] });
  const after = play(state, 0, { key: optionOf(state, "move", 3).key });
  assert.equal(turnOf(after), 0);
  assert.equal(after.players[0].hand.length, 1);
  assert.equal(after.lastPlay.bonus, true);
});

test("knocking out a marble of your own earns a card too", () => {
  const state = gameWith({ mine: [track(3), track(10)], hand: [card(13)], theirHand: [card(5)] });
  const sweep = viewFor(state, 0).options.find((option) => option.kind === "sweep" && option.moves[0].marble.id === 0);
  const after = play(state, 0, { key: sweep.key });
  assert.deepEqual(after.players[0].marbles[1], { at: "base", slot: 1 });
  assert.equal(after.lastPlay.bonus, true);
  assert.equal(turnOf(after), 0);
});

test("going home earns a card only for a marble that reaches the deepest hole still free", () => {
  const shallow = gameWith({ mine: [track(44)], hand: [card(3), card(9)], theirHand: [card(5)] });
  const stopped = play(shallow, 0, { key: optionOf(shallow, "move", 3).key });
  assert.deepEqual(stopped.players[0].marbles[0], home(0));
  assert.equal(stopped.lastPlay.bonus, undefined);
  assert.equal(turnOf(stopped), 1);

  const deep = gameWith({ mine: [track(44)], hand: [card(6), card(9)], theirHand: [card(5)] });
  const settled = play(deep, 0, { key: optionOf(deep, "move", 6).key });
  assert.deepEqual(settled.players[0].marbles[0], home(3));
  assert.equal(settled.lastPlay.bonus, true);
});

test("moving up inside home earns a card once the marble can go no deeper", () => {
  const state = gameWith({ mine: [home(0), home(3)], hand: [card(2), card(9)], theirHand: [card(5)] });
  const after = play(state, 0, { key: optionOf(state, "move", 2).key });
  assert.deepEqual(after.players[0].marbles[0], home(2));
  assert.equal(after.lastPlay.bonus, true);
});

test("the round's last card still earns its card when it knocks a marble out", () => {
  const state = gameWith({ mine: [track(3)], theirs: [track(6)], hand: [card(3)], theirHand: [] });
  const after = play(state, 0, { key: optionOf(state, "move", 3).key });
  assert.equal(after.lastPlay.bonus, true);
  assert.equal(after.players[0].hand.length, 1);
  assert.equal(turnOf(after), 0);
});

test("a ten used on the other player makes them choose the card they lose, which is their turn", () => {
  const state = gameWith({ hand: [card(10), card(9)], theirHand: [card(5), card(13)] });
  const asked = play(state, 0, { key: optionOf(state, "discardOther").key });
  assert.equal(turnOf(asked), 1);
  const [lose] = viewFor(asked, 1).options.filter((option) => option.card === "9-5S");
  const after = play(asked, 1, { key: lose.key });
  assert.deepEqual(after.players[1].hand, [card(13)]);
  assert.deepEqual(after.pile.at(-1), { card: card(5), seat: 1, thrown: true, round: 1 });
  assert.equal(turnOf(after), 0);
  assert.equal(after.pending, null);
});

test("a red queen takes the face-down card its player picked, and its victim loses their turn", () => {
  const state = gameWith({ hand: [card(12, "H"), card(9)], theirHand: [card(5), card(13)] });
  const option = viewFor(state, 0).options.find((offered) => offered.kind === "takeCard");
  assert.throws(() => play(state, 0, { key: option.key, taken: 5 }), /their cards/);
  const after = play(state, 0, { key: option.key, taken: 1 });
  assert.deepEqual(after.players[1].hand, [card(5)]);
  assert.deepEqual(after.lastPlay.lost, card(13));
  assert.equal(turnOf(after), 0);
});

test("with nothing that can change this round, the whole hand is thrown at once", () => {
  const state = gameWith({ mine: [home(3), home(2)], hand: [card(4), card(3)], theirHand: [card(5)] });
  const after = play(state, 0, { key: optionOf(state, "discardAll").key });
  assert.deepEqual(after.players[0].hand, []);
  assert.deepEqual(
    after.pile.map(({ thrown }) => thrown),
    [true, true]
  );
  assert.equal(turnOf(after), 1);
});

const endRound = (state) => {
  const emptied = { ...state, players: state.players.map((player, seat) => ({ ...player, hand: seat === turnOf(state) ? [card(3)] : [] })) };
  return play(emptied, turnOf(emptied), { key: viewFor(emptied, turnOf(emptied)).options[0].key });
};

test("a deck is dealt four, four, then five cards, all led by one player, and the next deck by the other", () => {
  let state = gameWith({ mine: [track(3)], hand: [], theirHand: [] });
  const dealt = [];
  for (let round = 0; round < 4; round += 1) {
    state = endRound(state);
    dealt.push([state.players[0].hand.length, turnOf(state)]);
  }
  assert.deepEqual(dealt, [
    [4, 0],
    [5, 0],
    [4, 1],
    [4, 1],
  ]);
  assert.deepEqual(viewFor(state, 0).deal, { left: 44, each: 4 });
});

test("the fourth marble home wins, and a finished game offers nothing", () => {
  const state = gameWith({ mine: [home(3), home(2), home(1), track(46)], hand: [card(1)], theirHand: [card(5)] });
  const after = play(state, 0, { key: optionOf(state, "move", 1).key });
  assert.deepEqual(outcome(after), { winners: [0] });
  assert.equal(viewFor(after, 0).options.length, 0);
  assert.throws(() => play(after, 1, { key: "anything" }), /over/);
});
