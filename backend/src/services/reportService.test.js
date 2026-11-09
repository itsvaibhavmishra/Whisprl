import { test } from "node:test";
import assert from "node:assert/strict";

import { evidenceFilesOf } from "#src/services/reportService.js";

const STORED = "https://res.cloudinary.com/whisprl-test/raw/upload/v1700000000/Chat%20Files/c/0b6e1c2a";

test("an evidence file is kept when it is the file stored for that message", () => {
  const sent = [{ url: STORED, key: "k", iv: "i", mimeType: "image/jpeg", name: "photo.jpg", extra: "dropped" }];
  assert.deepEqual(evidenceFilesOf(sent, { attachment: { url: STORED } }), [{ url: STORED, key: "k", iv: "i", mimeType: "image/jpeg", name: "photo.jpg" }]);
  assert.equal(evidenceFilesOf([{ url: STORED }], { files: [{ url: STORED }] }).length, 1);
});

test("a file the message never carried is dropped, wherever it points", () => {
  const offSite = { url: "https://attacker.example/x.html?res.cloudinary.com/upload/", mimeType: "text/html" };
  const otherOwnFile = { url: "https://res.cloudinary.com/whisprl-test/raw/upload/v1/another-message" };
  assert.equal(evidenceFilesOf([offSite, otherOwnFile], { attachment: { url: STORED } }), undefined);
});

test("a message that is not in the reported chat carries no files", () => {
  assert.equal(evidenceFilesOf([{ url: STORED }], undefined), undefined);
  assert.equal(evidenceFilesOf("not a list", { attachment: { url: STORED } }), undefined);
});
