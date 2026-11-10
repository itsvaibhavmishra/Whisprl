import { test } from "node:test";
import assert from "node:assert/strict";

import { PERSONAS } from "#src/services/games/botPersonas.js";
import { MOODS, SPEAKERS, lineFor, linesOf, speakerOf } from "#src/services/games/botLines.js";
import { gameNames, gameOf } from "#src/services/games/catalog.js";
import { REACTIONS } from "#src/services/games/reactions.js";

test("every bot and Whisprl has at least two lines for every mood", () => {
  assert.deepEqual([...SPEAKERS].sort(), [...PERSONAS, "whisprl"].sort());
  SPEAKERS.forEach((speaker) => MOODS.forEach((mood) => assert.ok(linesOf(speaker, mood).length >= 2, `${speaker} ${mood}`)));
});

test("every line pulls a face from the tray, so it can be shown like any thrown reaction", () => {
  SPEAKERS.forEach((speaker) =>
    MOODS.forEach((mood) => linesOf(speaker, mood).forEach(({ emoji }) => assert.ok(REACTIONS.includes(emoji), `${speaker} ${mood} ${emoji}`)))
  );
});

test("every moment a game reacts to is one of the moods there are lines for", () => {
  gameNames()
    .map(({ id }) => gameOf(id))
    .forEach((game) => Object.values(game.moods ?? {}).forEach((mood) => assert.ok(MOODS.includes(mood), `${game.id} ${mood}`)));
});

test("Whisprl speaks as itself and a chosen bot as the face it wears; a bot with no face says nothing", () => {
  assert.equal(speakerOf({ official: true, persona: "pogo" }), "whisprl");
  assert.equal(speakerOf({ bot: true, persona: "pogo" }), "pogo");
  assert.equal(lineFor(speakerOf({ bot: true }), "hello"), null);
});
