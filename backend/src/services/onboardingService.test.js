import { test } from "node:test";
import assert from "node:assert/strict";

import { hasPassedAgeCheck } from "#src/services/onboardingService.js";

const DAY = 24 * 60 * 60 * 1000;

test("an account passes the age check once it has a birthday and no pause running", () => {
  assert.equal(hasPassedAgeCheck({ birthday: new Date("1996-04-12") }), true);
  assert.equal(hasPassedAgeCheck({ birthday: new Date("1996-04-12"), agePausedUntil: new Date(Date.now() - DAY) }), true);
});

test("an account that never gave a birthday, or is paused for its age, is held back", () => {
  assert.equal(hasPassedAgeCheck({}), false);
  assert.equal(hasPassedAgeCheck({ birthday: new Date("1996-04-12"), agePausedUntil: new Date(Date.now() + DAY) }), false);
});
