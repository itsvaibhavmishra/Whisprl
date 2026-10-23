import { test } from "node:test";
import assert from "node:assert/strict";

import { isGameId } from "#src/services/games/catalog.js";

test("only a game in the catalog can mark a message", () => {
  assert.equal(isGameId("tic-tac-toe"), true);
  assert.equal(isGameId("chess"), false);
  assert.equal(isGameId({ $ne: null }), false);
  assert.equal(isGameId(undefined), false);
});
