import { test } from "node:test";
import assert from "node:assert/strict";

import { ongoingFor, played } from "#src/services/gameService.js";
import { setup } from "#src/services/games/jackaroo/rules.js";

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
