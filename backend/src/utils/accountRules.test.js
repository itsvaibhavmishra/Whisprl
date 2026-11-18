import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertBirthdayChange, bandOf, firstWordOf, genderFrom, nameFrom } from "#src/utils/accountRules.js";

const TODAY = new Date(Date.UTC(2026, 10, 17));
const DAY_MS = 24 * 60 * 60 * 1000;

describe("bandOf", () => {
  it("counts someone as an adult from their 18th birthday", () => {
    assert.equal(bandOf({ day: 17, month: 11, year: 2008 }, TODAY), "adult");
    assert.equal(bandOf({ day: 18, month: 11, year: 2008 }, TODAY), "minor");
  });
});

describe("assertBirthdayChange", () => {
  const adult = { birthday: { day: 1, month: 1, year: 1995 } };

  it("lets the first change through", () => {
    assert.doesNotThrow(() => assertBirthdayChange(adult, { day: 2, month: 1, year: 1995 }, TODAY));
  });

  it("refuses a second change within a year, and allows it after", () => {
    const changedRecently = { ...adult, birthdayChangedAt: new Date(TODAY - 300 * DAY_MS) };
    assert.throws(() => assertBirthdayChange(changedRecently, { day: 2, month: 1, year: 1995 }, TODAY), { status: 429 });

    const changedLongAgo = { ...adult, birthdayChangedAt: new Date(TODAY - 366 * DAY_MS) };
    assert.doesNotThrow(() => assertBirthdayChange(changedLongAgo, { day: 2, month: 1, year: 1995 }, TODAY));
  });

  it("never moves anyone across 18 either way", () => {
    assert.throws(() => assertBirthdayChange(adult, { day: 1, month: 1, year: 2012 }, TODAY), { status: 403 });
    const minor = { birthday: { day: 1, month: 1, year: 2012 } };
    assert.throws(() => assertBirthdayChange(minor, { day: 1, month: 1, year: 1995 }, TODAY), { status: 403 });
  });
});

describe("genderFrom", () => {
  it("takes only the three choices", () => {
    assert.equal(genderFrom("undisclosed"), "undisclosed");
    assert.throws(() => genderFrom("other"), { status: 400 });
    assert.throws(() => genderFrom(undefined), { status: 400 });
  });
});

describe("nameFrom", () => {
  it("takes one name in any language, tidying its spaces", () => {
    assert.equal(nameFrom("  Li   Na "), "Li Na");
    assert.equal(nameFrom("José O'Neil-Ávila"), "José O'Neil-Ávila");
    assert.equal(nameFrom("प्रिया शर्मा"), "प्रिया शर्मा");
  });

  it("refuses one letter, more than thirty, and digits or symbols", () => {
    for (const name of ["A", "x".repeat(31), "R2D2", "Ann <b>", "-Ann"]) assert.throws(() => nameFrom(name), { status: 400 });
    assert.throws(() => nameFrom(["Ann"]), { status: 400 });
  });

  it("greets by the first word", () => {
    assert.equal(firstWordOf("Bianca Rossi"), "Bianca");
  });
});
