import { test } from "node:test";
import assert from "node:assert/strict";

import { spellingByPerson } from "#src/services/gameRequestService.js";

test("each person who asked is told once, however many times they asked", () => {
  const told = spellingByPerson([
    { user: "asha", name: "ludo" },
    { user: "bea", name: "Ludo" },
    { user: "asha", name: "LUDO!" },
  ]);
  assert.equal(told.size, 2);
  assert.equal(told.get("asha"), "LUDO!");
  assert.equal(told.get("bea"), "Ludo");
});
