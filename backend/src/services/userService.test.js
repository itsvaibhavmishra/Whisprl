import { test } from "node:test";
import assert from "node:assert/strict";

import { isGameLevel } from "#src/services/userService.js";

test("a game level is a number from zero to one, both ends included", () => {
  assert.equal(isGameLevel(0), true);
  assert.equal(isGameLevel(0.1), true);
  assert.equal(isGameLevel(1), true);
  assert.equal(isGameLevel(1.01), false);
  assert.equal(isGameLevel(-0.1), false);
  assert.equal(isGameLevel("0.5"), false);
  assert.equal(isGameLevel(undefined), false);
});
