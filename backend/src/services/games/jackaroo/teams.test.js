import { test } from "node:test";
import assert from "node:assert/strict";

import { gameOf } from "#src/services/games/catalog.js";
import { botMove } from "#src/services/games/jackaroo/bot.js";
import { movedBy, playsForTurn } from "#src/services/games/jackaroo/moves.js";
import { outcome, play, setup, turnOf, viewFor } from "#src/services/games/jackaroo/rules.js";
import { withSeed } from "#src/services/games/withSeed.js";

const base = (slot) => ({ at: "base", slot });
const track = (index) => ({ at: "track", index });
const home = (slot) => ({ at: "home", slot });
const card = (rank, suit = "S") => ({ id: `1-${rank}${suit}`, rank, suit });
const ALL_HOME = [home(0), home(1), home(2), home(3)];

// a four-seat board laid out by hand: each seat's marbles by seat, seat 0's hand, and a card for everyone else
const teamBoard = ({ marbles = [], hand = [], hands = [] } = {}) => ({
  mode: "teams",
  players: [0, 1, 2, 3].map((seat) => ({
    hand: seat === 0 ? hand : (hands[seat] ?? [card(3, "C")]),
    marbles: [0, 1, 2, 3].map((slot) => marbles[seat]?.[slot] ?? base(slot)),
  })),
  pending: null,
});

const playsOf = (state, kind) => playsForTurn(state, 0).filter((play) => play.kind === kind);
const endsOf = (plays) => plays.map((play) => play.moves.at(-1).to);

test("Jackaroo 2v2 is its own game for four, playing the team rules", () => {
  const game = gameOf("jackaroo-teams");
  assert.deepEqual([game.minPlayers, game.maxPlayers], [4, 4]);
  assert.equal(game.setup(null, { players: 4, seating: null }).mode, "teams");
  assert.equal(gameOf("jackaroo").setup(null, { players: 2 }).mode, "single");
});

test("between two people, the other person sits opposite as a partner or beside you as an opponent", () => {
  const game = gameOf("jackaroo-teams");
  assert.equal(game.peerSeatOf(game.options.defaults), 2);
  assert.equal(game.peerSeatOf({ pairing: "against" }), 1);
  assert.doesNotThrow(() => game.options.assert({ pairing: "against", players: 4 }));
  assert.throws(() => game.options.assert({ pairing: "sideways", players: 4 }));
});

test("a team game seats four, deals four cards each and starts every marble in its base", () => {
  const state = setup(null, { mode: "teams" });
  assert.equal(state.players.length, 4);
  assert.ok(state.players.every(({ hand }) => hand.length === 4));
  assert.ok(state.players.every(({ marbles }) => marbles.every((place) => place.at === "base")));
  assert.deepEqual(setup(null, { mode: "single" }).players[0].marbles[0], track(0));
  assert.ok([0, 1, 2, 3].includes(turnOf(state)));
});

test("an ace brings out, or moves one or eleven", () => {
  const plays = playsForTurn(teamBoard({ marbles: [[track(5)]], hand: [card(1)] }), 0);
  assert.deepEqual(
    plays.map((play) => play.moves[0].to).sort((one, other) => one.index - other.index),
    [track(0), track(6), track(16)]
  );
});

test("a king only brings a marble out, every jack swaps and every queen moves twelve", () => {
  assert.deepEqual(playsOf(teamBoard({ marbles: [[track(5)]], hand: [card(13)] }), "move"), []);
  assert.equal(playsOf(teamBoard({ marbles: [[track(5)]], hand: [card(13)] }), "out").length, 1);
  assert.equal(playsOf(teamBoard({ marbles: [[track(5)], [track(30)]], hand: [card(11, "H")] }), "swap").length, 1);
  assert.deepEqual(endsOf(playsOf(teamBoard({ marbles: [[track(5)]], hand: [card(12, "H")] }), "move")), [track(17)]);
});

test("a marble never passes its own player's others, but passes anyone else's", () => {
  assert.deepEqual(endsOf(playsOf(teamBoard({ marbles: [[track(3), track(5)]], hand: [card(3)] }), "move")), [track(8)]);
  assert.deepEqual(endsOf(playsOf(teamBoard({ marbles: [[track(3)], [track(4)], [track(5)]], hand: [card(3)] }), "move")), [track(6)]);
});

test("a partner's marble sitting on its own start blocks everyone, its partner too", () => {
  assert.deepEqual(playsOf(teamBoard({ marbles: [[track(36)], [], [track(38)]], hand: [card(3)] }), "move"), []);
});

test("landing on a partner knocks them out, but the play is not shown as a knock-out", () => {
  const state = teamBoard({ marbles: [[track(10)], [], [track(13)]], hand: [card(3)] });
  const [knock] = playsOf(state, "move");
  assert.deepEqual(knock.moves[0].captured[0].marble, { owner: 2, id: 0 });
  const view = viewFor({ ...setup(null, { mode: "teams" }), players: state.players, turn: 0, shown: null }, 0);
  assert.equal(view.options.find((option) => option.kind === "move").moves[0].knocksOut, false);
});

test("a ten makes the next player, always an opponent, lose a card and their turn", () => {
  const state = { ...setup(null, { mode: "teams" }), turn: 0, pending: null, shown: null };
  state.players[0].hand = [card(10)];
  state.players[1].hand = [card(3), card(6)];
  const tenPlay = viewFor(state, 0).options.find((option) => option.kind === "discardOther");
  const after = play(state, 0, { key: tenPlay.key });
  assert.equal(turnOf(after), 1);
  const lost = play(after, 1, { key: viewFor(after, 1).options[0].key });
  assert.equal(lost.players[1].hand.length, 1);
  assert.equal(turnOf(lost), 2);
});

test("once all four of your marbles are home, your cards move your partner's, and an ace brings theirs out", () => {
  const state = teamBoard({ marbles: [ALL_HOME, [], [track(40)]], hand: [card(1)] });
  assert.equal(movedBy(state, 0), 2);
  assert.ok(playsForTurn(state, 0).every((play) => play.moves[0].marble.owner === 2));
  assert.deepEqual(endsOf(playsOf(state, "out")), [track(38)]);
  const startTaken = teamBoard({ marbles: [ALL_HOME, [], [track(38)]], hand: [card(1)] });
  assert.equal(playsOf(startTaken, "out").length, 0);
});

test("a seven may finish on a partner's marble only when its first part takes your last marble home", () => {
  // home fills from its deepest hole, so the last marble in goes to the shallowest
  const last = teamBoard({ marbles: [[home(1), home(2), home(3), track(72)], [], [track(40)]], hand: [card(7)] });
  const splits = playsOf(last, "split");
  assert.ok(splits.some((play) => play.moves[0].marble.owner === 0 && play.moves[1].marble.owner === 2));
  const notLast = teamBoard({ marbles: [[home(2), home(3), track(20), track(72)], [], [track(40)]], hand: [card(7)] });
  assert.ok(playsOf(notLast, "split").every((play) => play.moves.every((move) => move.marble.owner === 0)));
});

test("a five moves anyone's marble, and only its own team takes it home", () => {
  const state = teamBoard({ marbles: [[track(10)], [track(15)], [track(34)]], hand: [card(5)] });
  const ends = playsOf(state, "move").map((play) => [play.moves[0].marble.owner, play.moves[0].to]);
  assert.equal(ends.find(([owner]) => owner === 2)[1].at, "home");
  const opponent = teamBoard({ marbles: [[track(10)], [track(15)]], hand: [card(5)] });
  assert.deepEqual(playsOf(opponent, "move").find((play) => play.moves[0].marble.owner === 1).moves[0].to, track(20));
});

test("a swap takes your own marble off its start, but never anyone else's", () => {
  assert.equal(playsOf(teamBoard({ marbles: [[track(0)], [track(30)]], hand: [card(11)] }), "swap").length, 1);
  assert.equal(playsOf(teamBoard({ marbles: [[track(5)], [track(57)]], hand: [card(11)] }), "swap").length, 0);
});

test("partners win together, and only once all eight of their marbles are home", () => {
  const state = { ...setup(null, { mode: "teams" }), turn: 0, pending: null, shown: null };
  state.players[0].marbles = ALL_HOME;
  state.players[2].marbles = [home(1), home(2), home(3), track(35)];
  state.players[0].hand = [card(2)];
  const winning = viewFor(state, 0).options.find((option) => option.moves?.[0].to.at === "home");
  const after = play(state, 0, { key: winning.key });
  assert.deepEqual(outcome(after), { winners: [0, 2] });
  assert.deepEqual(viewFor(after, 1).winners, [0, 2]);
});

test("four bots always finish a team game", () => {
  withSeed(3, () => {
    for (let game = 0; game < 20; game += 1) {
      let state = setup(null, { mode: "teams" });
      for (let move = 0; state.winner === null; move += 1) {
        assert.ok(move < 4000, "a team game ran on without finishing");
        const seat = turnOf(state);
        state = play(state, seat, botMove(state, seat, ["medium", "dumb", "pro", "standIn"][seat]));
      }
      assert.equal(outcome(state).winners.length, 2);
    }
  });
});
