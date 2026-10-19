import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isWithinEdits, nameKeyOf, normalized, searchScore } from "#src/utils/textSearch.js";

const nameOnly = (name) => [{ text: name, weight: 3 }];

describe("normalized", () => {
  it("folds accents, case and punctuation", () => {
    assert.equal(normalized("  Café  CRUSH!! "), "cafe crush");
  });

  it("keeps letters from any script, so a name in Hindi still has a key", () => {
    assert.notEqual(nameKeyOf("लूडो किंग"), "");
    assert.equal(nameKeyOf("लूडो किंग"), nameKeyOf("लूडो  किंग!"));
  });
});

describe("nameKeyOf", () => {
  it("treats spacing, hyphens and a leading 'the' as the same game", () => {
    const key = nameKeyOf("Tic-Tac-Toe");
    assert.equal(nameKeyOf("tic tac toe"), key);
    assert.equal(nameKeyOf("The TicTacToe"), key);
  });

  it("reads an ampersand as 'and'", () => {
    assert.equal(nameKeyOf("Dots & Boxes"), nameKeyOf("dots and boxes"));
  });
});

describe("isWithinEdits", () => {
  it("counts a swapped pair of letters as one typo", () => {
    assert.equal(isWithinEdits("lduo", "ludo", 1), true);
  });

  it("refuses more typos than allowed", () => {
    assert.equal(isWithinEdits("lado", "ludo", 1), true);
    assert.equal(isWithinEdits("lada", "ludo", 1), false);
  });
});

describe("searchScore", () => {
  it("finds a name from the start of a word, a typo or words run together", () => {
    assert.ok(searchScore("lud", nameOnly("Ludo King")) > 0);
    assert.ok(searchScore("chesss", nameOnly("Chess")) > 0);
    assert.ok(searchScore("tictac", nameOnly("Tic Tac Toe")) > 0);
  });

  it("ranks an exact word above a prefix, and a prefix above a typo", () => {
    const exact = searchScore("uno", nameOnly("Uno"));
    const prefix = searchScore("un", nameOnly("Uno"));
    const typo = searchScore("ludp", nameOnly("Ludo"));
    assert.ok(exact > prefix && prefix > typo);
  });

  it("needs every word to match somewhere", () => {
    assert.equal(searchScore("ludo chess", nameOnly("Ludo")), 0);
    assert.ok(searchScore("ludo sunday", [{ text: "Ludo", weight: 3 }, { text: "We play it every Sunday", weight: 1 }]) > 0);
  });

  it("weighs a match in the name above one in the details", () => {
    const inName = searchScore("cards", [{ text: "Cards", weight: 3 }, { text: "", weight: 1 }]);
    const inDetails = searchScore("cards", [{ text: "Uno", weight: 3 }, { text: "a game of cards", weight: 1 }]);
    assert.ok(inName > inDetails);
  });

  it("matches nothing for an empty query", () => {
    assert.equal(searchScore("  !! ", nameOnly("Uno")), 0);
  });
});
