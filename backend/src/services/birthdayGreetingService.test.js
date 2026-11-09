import { test } from "node:test";
import assert from "node:assert/strict";

import { birthdaysOn } from "#src/services/birthdayGreetingService.js";

test("a birthday is matched by day and month", () => {
  assert.deepEqual(birthdaysOn(new Date(Date.UTC(2026, 10, 9))), [{ day: 9, month: 11 }]);
});

test("someone born on 29 February is greeted on the 28th in a year without one, and on the 29th in a year with one", () => {
  assert.deepEqual(birthdaysOn(new Date(Date.UTC(2027, 1, 28))), [
    { day: 28, month: 2 },
    { day: 29, month: 2 },
  ]);
  assert.deepEqual(birthdaysOn(new Date(Date.UTC(2028, 1, 28))), [{ day: 28, month: 2 }]);
  assert.deepEqual(birthdaysOn(new Date(Date.UTC(2028, 1, 29))), [{ day: 29, month: 2 }]);
});
