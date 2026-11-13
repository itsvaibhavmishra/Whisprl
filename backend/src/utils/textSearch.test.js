import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { nameKeyOf, normalized } from "#src/utils/textSearch.js";

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
