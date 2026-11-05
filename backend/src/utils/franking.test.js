import { test } from "node:test";
import assert from "node:assert/strict";

import { textIn } from "#src/utils/franking.js";

test("the words of a written message come from its structured payload", () => {
  assert.equal(textIn(`\u0001${JSON.stringify({ text: "see you at six", frankingKey: "key" })}`), "see you at six");
});

test("a file's words are its caption", () => {
  assert.equal(textIn(JSON.stringify({ caption: "the receipt", file: {}, frankingKey: "key" })), "the receipt");
});

test("a payload that is not JSON has no words to show", () => {
  assert.equal(textIn("plain words"), "");
  assert.equal(textIn("null"), "");
});
