import { test } from "node:test";
import assert from "node:assert/strict";

import { botMove, momentFor } from "#src/services/games/jackaroo/bot.js";
import { keyOf, playsFor } from "#src/services/games/jackaroo/moves.js";
import { outcome, play, setup, turnOf, viewFor } from "#src/services/games/jackaroo/rules.js";
import { withSeed } from "#src/services/games/withSeed.js";

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
  for (let game = 0; game < 60; game += 1) playedOut(["medium", "standIn"]);
});

test("a practised player beats it a little more often than not, and beats a stand-in more", () => {
  const againstOpponent = withSeed(1, () => winRate(400, [PRACTISED, "medium"]));
  const againstStandIn = withSeed(2, () => winRate(400, [PRACTISED, "standIn"]));
  assert.ok(againstOpponent > 0.5 && againstOpponent < 0.75, `practised won ${againstOpponent} against the opponent`);
  assert.ok(againstStandIn > againstOpponent - 0.05, `practised won ${againstStandIn} against the stand-in`);
});

test("a medium bot beats a dumb one, and the expert beats a medium one, more often than not", () => {
  withSeed(1, () => {
    assert.ok(winRate(200, ["medium", "dumb"]) > 0.55, "medium did not beat dumb");
    assert.ok(winRate(200, ["expert", "medium"]) > 0.55, "expert did not beat medium");
  });
});

test("a bot reacts when it knocks a marble out, and when its own is knocked out", () => {
  const state = gameWith({ mine: [track(3)], theirs: [track(9)], hand: [card(6), card(3)] });
  const after = play(state, 0, botMove(state, 0, PRACTISED));
  assert.equal(momentFor(state, after, 0), "knockedOut");
  assert.equal(momentFor(state, after, 1), "knockedBack");
});

const playThat = (state, seat, isWanted) => ({ key: keyOf(state.players[seat].hand.flatMap((held) => playsFor(state, seat, held)).find(isWanted)) });

test("a bot melts when its card is taken, and the taker gets a cheeky face", () => {
  const state = gameWith({ mine: [track(3)], hand: [card(12, "H"), card(9)], theirHand: [card(3, "C"), card(8, "C")] });
  const after = play(state, 0, { ...playThat(state, 0, (option) => option.kind === "takeCard"), taken: 0 });
  assert.equal(momentFor(state, after, 1), "cardTaken");
  assert.equal(momentFor(state, after, 0), "tookCard");
});

test("a bot sobs when its own five knocks out its own marble", () => {
  const state = gameWith({ mine: [track(3), track(8)], hand: [card(5)] });
  const ownGoal = (option) => option.moves?.some((move) => move.captured.some(({ marble }) => marble.owner === 0));
  const after = play(state, 0, playThat(state, 0, ownGoal));
  assert.equal(momentFor(state, after, 0), "ownGoal");
});

test("a bot is cool about taking a marble home, and alarmed when its rival does", () => {
  const state = gameWith({ mine: [track(45)], hand: [card(2)] });
  const after = play(
    state,
    0,
    playThat(state, 0, (option) => option.moves?.[0].to.at === "home")
  );
  assert.equal(momentFor(state, after, 0), "reachedHome");
  assert.equal(momentFor(state, after, 1), "rivalHome");
});
