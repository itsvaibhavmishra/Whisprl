import { test } from "node:test";
import assert from "node:assert/strict";

import { PACE, playOutMs, thinkMs } from "#src/services/games/jackaroo/pace.js";
import { play, setup, viewFor } from "#src/services/games/jackaroo/rules.js";

const track = (index) => ({ at: "track", index });
const home = (slot) => ({ at: "home", slot });
const card = (rank, suit = "S") => ({ id: `9-${rank}${suit}`, rank, suit });

const gameWith = ({ mine = [], theirs = [], hand, theirHand }) => {
  const state = setup(null, { players: 2 });
  const place = (places) => [0, 1, 2, 3].map((slot) => places[slot] ?? { at: "base", slot });
  state.players[0] = { hand, marbles: place(mine) };
  state.players[1] = { hand: theirHand, marbles: place(theirs) };
  return { ...state, turn: 0, leader: 0 };
};

const playedWith = (state, kind) => play(state, 0, { key: viewFor(state, 0).options.find((option) => option.kind === kind).key });

test("a fresh game waits for its deal", () => {
  assert.equal(playOutMs(setup(null, { players: 2 })), PACE.deal);
});

test("a move waits for its card, every hop and a beat to read it", () => {
  const after = playedWith(gameWith({ mine: [track(3)], hand: [card(3), card(9)], theirHand: [card(5)] }), "move");
  assert.equal(playOutMs(after), PACE.card + PACE.marbleAfterCard + 3 * PACE.hop + PACE.beat);
});

test("a knock-out waits for the marble to fly home and the bonus card to arrive", () => {
  const after = playedWith(gameWith({ mine: [track(3)], theirs: [track(6)], hand: [card(3), card(9)], theirHand: [card(5)] }), "move");
  assert.equal(playOutMs(after), PACE.card + PACE.marbleAfterCard + 3 * PACE.hop + PACE.knockOut + PACE.bonus);
});

test("a swirl waits for the pause and the glide", () => {
  const after = playedWith(gameWith({ mine: [track(13)], hand: [card(3), card(9)], theirHand: [card(5)] }), "move");
  assert.equal(playOutMs(after), PACE.card + PACE.marbleAfterCard + 3 * PACE.hop + PACE.swirlPause + PACE.swirlGlide + PACE.beat);
});

test("a swap waits for its arrows and both marbles' float", () => {
  const after = playedWith(gameWith({ mine: [track(3)], theirs: [track(10)], hand: [card(11), card(9)], theirHand: [card(5)] }), "swap");
  assert.equal(playOutMs(after), PACE.card + PACE.swap + PACE.beat);
});

test("the last play of a round waits for the next deal as well", () => {
  const after = playedWith(gameWith({ mine: [track(3)], hand: [card(3)], theirHand: [] }), "move");
  assert.equal(playOutMs(after), PACE.card + PACE.marbleAfterCard + 3 * PACE.hop + PACE.beat + PACE.deal);
});

test("the winning play waits for its cheer before the result shows", () => {
  const after = playedWith(gameWith({ mine: [home(3), home(2), home(1), track(44)], hand: [card(3), card(9)], theirHand: [card(5)] }), "move");
  assert.equal(after.winner, 0);
  assert.equal(playOutMs(after), PACE.card + PACE.marbleAfterCard + 3 * PACE.hop + PACE.beat + PACE.win);
});

test("the bot glances when it has one choice and looks longer when it has several", () => {
  const oneChoice = gameWith({ mine: [track(3)], hand: [card(3)], theirHand: [card(5)] });
  assert.equal(thinkMs(oneChoice), 500);
  const several = gameWith({ mine: [track(3), track(9)], hand: [card(3), card(8)], theirHand: [card(5)] });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const wait = thinkMs(several);
    assert.ok(wait >= 900 && wait <= 2600, `${wait} ms`);
  }
});
