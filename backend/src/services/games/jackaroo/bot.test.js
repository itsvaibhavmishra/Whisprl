import { test } from "node:test";
import assert from "node:assert/strict";

import { botMove } from "#src/services/games/jackaroo/bot.js";
import { outcome, play, setup, turnOf, viewFor } from "#src/services/games/jackaroo/rules.js";

const track = (index) => ({ at: "track", index });
const home = (slot) => ({ at: "home", slot });
const card = (rank, suit = "S") => ({ id: `9-${rank}${suit}`, rank, suit });
// a level the bot has no slips for, so it plays every turn attentively
const PRACTISED = "practised";

const gameWith = ({ mine = [], theirs = [], hand, theirHand = [card(5, "C")] }) => {
  const state = setup(null, { players: 2 });
  const place = (places) => [0, 1, 2, 3].map((slot) => places[slot] ?? { at: "base", slot });
  state.players[0] = { hand, marbles: place(mine) };
  state.players[1] = { hand: theirHand, marbles: place(theirs) };
  return { ...state, turn: 0, leader: 0 };
};

const kindOf = (state, move) => viewFor(state, 0).options.find((option) => option.key === move.key).kind;

test("a win is always taken, even by a distracted bot", () => {
  const state = gameWith({ mine: [home(3), home(2), home(1), track(45)], theirs: [track(10)], hand: [card(9), card(2)] });
  for (let attempt = 0; attempt < 20; attempt += 1) assert.deepEqual(outcome(play(state, 0, botMove(state, 0, "standIn"))), { winners: [0] });
});

test("an attentive bot knocks out a rival when it can", () => {
  const state = gameWith({ mine: [track(3)], theirs: [track(9)], hand: [card(6), card(3)] });
  const after = play(state, 0, botMove(state, 0, PRACTISED));
  assert.deepEqual(after.players[1].marbles[0], { at: "base", slot: 0 });
});

test("made to throw a card away, it gives up the least useful one", () => {
  const state = gameWith({ hand: [card(10), card(9)], theirHand: [card(13), card(8, "C"), card(1)] });
  const asked = play(state, 0, { key: viewFor(state, 0).options.find((option) => option.kind === "discardOther").key });
  const after = play(asked, 1, botMove(asked, 1, PRACTISED));
  assert.deepEqual(
    after.players[1].hand.map(({ rank }) => rank),
    [13, 1]
  );
});

test("its red queen is put down first, then picks one of the cards actually there", () => {
  const state = gameWith({ hand: [card(12, "H")], theirHand: [card(3), card(8)] });
  assert.deepEqual(botMove(state, 0, PRACTISED), { show: "9-12H" });
  const shown = play(state, 0, { show: "9-12H" });
  const move = botMove(shown, 0, PRACTISED);
  assert.equal(kindOf(shown, move), "takeCard");
  assert.ok(move.taken === 0 || move.taken === 1);
});

test("standing in for a player, it finishes the card they put down, and never puts one down itself", () => {
  const state = gameWith({ mine: [track(3)], hand: [card(12, "H"), card(9)], theirHand: [card(3), card(8)] });
  assert.equal(botMove(state, 0, "standIn").show, undefined);
  const shown = play(state, 0, { show: "9-12H" });
  assert.equal(kindOf(shown, botMove(shown, 0, "standIn")), "takeCard");
});

const playedOut = (levels) => {
  let state = setup(null, { players: 2 });
  for (let turns = 0; !outcome(state); turns += 1) {
    assert.ok(turns < 3000, "the game did not finish");
    const seat = turnOf(state);
    state = play(state, seat, botMove(state, seat, levels[seat]));
  }
  return outcome(state).winners[0];
};

const winRate = (games, levels) => {
  let wins = 0;
  for (let game = 0; game < games; game += 1) wins += playedOut(game % 2 ? levels : [...levels].reverse()) === (game % 2 ? 0 : 1) ? 1 : 0;
  return wins / games;
};

test("bots playing each other always finish, through every rule", () => {
  for (let game = 0; game < 60; game += 1) playedOut(["opponent", "standIn"]);
});

test("a practised player beats it a little more often than not, and beats a stand-in more", () => {
  const againstOpponent = winRate(400, [PRACTISED, "opponent"]);
  const againstStandIn = winRate(400, [PRACTISED, "standIn"]);
  assert.ok(againstOpponent > 0.5 && againstOpponent < 0.75, `practised won ${againstOpponent} against the opponent`);
  assert.ok(againstStandIn > againstOpponent - 0.05, `practised won ${againstStandIn} against the stand-in`);
});
