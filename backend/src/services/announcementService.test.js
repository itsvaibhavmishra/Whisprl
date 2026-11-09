import { test } from "node:test";
import assert from "node:assert/strict";

import { announce } from "#src/services/announcementService.js";

const STAFF = { _id: "staff" };
const refusal = (details) => announce(null, STAFF, { text: "Hello", audience: "everyone", ...details });

test("an announcement needs words, an audience and, if it has a button, a label and a place in the app", async () => {
  await assert.rejects(refusal({ text: "   " }), /Write what Whisprl should say/);
  await assert.rejects(refusal({ text: "a".repeat(501) }), /Keep it under 500 characters/);
  await assert.rejects(refusal({ audience: "teens" }), /Choose who it goes to/);
  await assert.rejects(refusal({ button: { kind: "open", label: " ", to: "/contacts" } }), /Give the button a label/);
  await assert.rejects(refusal({ button: { kind: "open", label: "Go", to: "https://example.com" } }), /Choose where the button goes/);
  await assert.rejects(refusal({ button: { kind: "open", label: "Go", to: "//example.com" } }), /Choose where the button goes/);
  await assert.rejects(refusal({ button: { kind: "open", label: "Go", to: "/\\example.com" } }), /Choose where the button goes/);
});
