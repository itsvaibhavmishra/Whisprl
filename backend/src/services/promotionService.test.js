import { test } from "node:test";
import assert from "node:assert/strict";

import { stageOf } from "#src/services/promotionService.js";

const NOW = new Date();

test("someone joining for the first time starts at the group", () => {
  assert.equal(stageOf(null), "group");
  assert.equal(stageOf({}), "group");
});

test("a returning tester carries on from the step they reached", () => {
  assert.equal(stageOf({ linkSteps: { group: NOW } }), "play");
  assert.equal(stageOf({ linkSteps: { group: NOW, play: NOW } }), "app");
});

test("a claimed badge is the end, whatever steps were recorded", () => {
  assert.equal(stageOf({ claimedAt: NOW }), "claimed");
  assert.equal(stageOf({ claimedAt: NOW, linkSteps: { group: NOW } }), "claimed");
});
