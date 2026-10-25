import { test } from "node:test";
import assert from "node:assert/strict";

import { ongoingFor } from "#src/services/gameService.js";

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
