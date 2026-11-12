import { test } from "node:test";
import assert from "node:assert/strict";

import { isTeamCipher, ongoingFor, played, teamPartnerOf } from "#src/services/gameService.js";
import { setup, viewFor } from "#src/services/games/jackaroo/rules.js";

const session = (status, seats) => ({ conversation: "chat", game: "jackaroo", status, seats });

test("a game being played is ongoing for each person still in their seat", () => {
  const playing = session("playing", [{ user: "ava" }, { user: "riya" }]);
  assert.deepEqual(ongoingFor(playing, "ava"), { conversationId: "chat", game: "jackaroo" });
  assert.equal(ongoingFor(playing, "ben"), null);
});

test("a seat the bot took over, a game not started yet and no game at all are nobody's ongoing game", () => {
  assert.equal(ongoingFor(session("playing", [{ user: "ava", bot: true }, { user: "riya" }]), "ava"), null);
  assert.equal(ongoingFor(session("lobby", [{ user: "ava" }, { user: "riya" }]), "ava"), null);
  assert.equal(ongoingFor(null, "ava"), null);
});

const queenUp = (seats) => {
  const state = setup(null, { players: 2 });
  state.players[0].hand = [{ id: "9-12H", rank: 12, suit: "H" }];
  state.players[1].hand = [{ id: "9-5S", rank: 5, suit: "S" }];
  const turnEndsAt = new Date(Date.now() + 9000);
  return { ...session("playing", seats), state: { ...state, turn: 0, leader: 0 }, turnStartsAt: new Date(), turnEndsAt };
};

test("putting a card down leaves a person's clock running, while a bot still gets its pause to choose", () => {
  const person = queenUp([{ user: "ava" }, { user: "riya" }]);
  assert.equal(played(person, 0, { show: "9-12H" }).turnEndsAt, person.turnEndsAt);
  const bot = queenUp([{ bot: true }, { user: "riya" }]);
  assert.notEqual(played(bot, 0, { show: "9-12H" }).turnEndsAt, bot.turnEndsAt);
});

test("a card a knock-out earns is played on the same clock, not a fresh one", () => {
  const knockOut = queenUp([{ user: "ava" }, { user: "riya" }]);
  knockOut.state.players[0].marbles[0] = { at: "track", index: 3 };
  knockOut.state.players[1].marbles[0] = { at: "track", index: 6 };
  knockOut.state.players[0].hand = [{ id: "9-3S", rank: 3, suit: "S" }];
  const landing = viewFor(knockOut.state, 0).options.find((option) => option.moves?.[0].to.index === 6);
  const after = played(knockOut, 0, { key: landing.key });
  assert.equal(after.state.lastPlay.bonus, true);
  const clockMs = after.turnEndsAt.getTime() - after.turnStartsAt.getTime();
  assert.ok(clockMs <= 9000 && clockMs > 8000);
});

const teamTable = (seats) => ({ game: "jackaroo-teams", status: "playing", seats, state: { mode: "teams" } });

test("a team message goes only to a partner playing their own seat", () => {
  const people = [{ user: "ava" }, { user: "ben" }, { user: "cal" }, { user: "dee" }];
  assert.equal(teamPartnerOf(teamTable(people), "ava").user, "cal");
  assert.equal(teamPartnerOf(teamTable(people), "ben").user, "dee");
  assert.equal(teamPartnerOf(teamTable([people[0], people[1], { bot: true }, people[3]]), "ava"), null);
  assert.equal(teamPartnerOf(teamTable([people[0], people[1], { user: "cal", away: true }, people[3]]), "ava"), null);
  assert.equal(teamPartnerOf(teamTable(people), "eve"), null);
  assert.equal(teamPartnerOf({ game: "jackaroo", status: "playing", seats: people.slice(0, 2), state: {} }, "ava"), null);
});

test("a team message must be sealed for exactly one reader", () => {
  const sealed = { iv: "aa", data: "bb", senderKeyId: "k1", keys: [{ keyId: "k2", iv: "cc", data: "dd" }] };
  assert.ok(isTeamCipher(sealed));
  assert.equal(isTeamCipher({ ...sealed, keys: [...sealed.keys, sealed.keys[0]] }), false);
  assert.equal(isTeamCipher({ ...sealed, data: "" }), false);
  assert.equal(isTeamCipher({ ...sealed, data: "x".repeat(7000) }), false);
  assert.equal(isTeamCipher(null), false);
});
