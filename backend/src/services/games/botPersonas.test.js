import { test } from "node:test";
import assert from "node:assert/strict";

import { PERSONAS, freshPersona } from "#src/services/games/botPersonas.js";

test("a fresh face is one nobody at the table is wearing", () => {
  const seats = PERSONAS.slice(0, -1).map((persona) => ({ bot: true, persona }));
  assert.equal(freshPersona(seats), PERSONAS.at(-1));
});

test("a bot never wears the face it wore last game when another is free", () => {
  const lastFace = () => 0.99;
  assert.equal(freshPersona([], lastFace, PERSONAS.at(-1)), PERSONAS.at(-2));
});
