import { test } from "node:test";
import assert from "node:assert/strict";

import { pushDataFor } from "#src/services/pushService.js";

const sender = { _id: "alice", firstName: "Alice", lastName: "Reed", publicKeys: [{ keyId: "alice-key", publicKey: "alice-public" }] };
const direct = { _id: "chat", isGroup: false };
const group = { _id: "group", isGroup: true, name: "Game night" };

const sentAt = new Date("2026-10-25T09:30:00.000Z");
const directMessage = { _id: "message", createdAt: sentAt, cipher: { iv: "iv", data: "data", keyIds: ["alice-key", "bob-key"] } };
const groupMessage = {
  _id: "group-message",
  createdAt: sentAt,
  cipher: {
    iv: "iv",
    data: "data",
    senderKeyId: "alice-key",
    keys: [
      { keyId: "bob-key", iv: "bob-iv", data: "bob-sealed" },
      { keyId: "carol-key", iv: "carol-iv", data: "carol-sealed" },
    ],
  },
};

test("a direct message carries its ciphertext and the sender's key, for the phone to open", () => {
  assert.deepEqual(pushDataFor(direct, sender, directMessage, "bob", "bob-key"), {
    conversationId: "chat",
    recipientId: "bob",
    senderId: "alice",
    title: "Alice Reed",
    messageId: "message",
    createdAt: "2026-10-25T09:30:00.000Z",
    kind: "text",
    keyId: "bob-key",
    senderPublicKey: "alice-public",
    cipherIv: "iv",
    cipherData: "data",
  });
});

test("a group message carries only the key sealed for the person it goes to", () => {
  const data = pushDataFor(group, sender, groupMessage, "bob", "bob-key");
  assert.equal(data.title, "Game night");
  assert.equal(data.sender, "Alice");
  assert.deepEqual([data.sealedIv, data.sealedData], ["bob-iv", "bob-sealed"]);
  assert.ok(!JSON.stringify(data).includes("carol"));
});

test("a message not sealed for the recipient's key goes with the names alone", () => {
  const waiting = { ...directMessage, cipher: { iv: "iv", data: "data", keyIds: ["alice-key", "alice-key"] } };
  assert.equal(pushDataFor(direct, sender, waiting, "bob", "bob-key").cipherData, undefined);
  assert.equal(pushDataFor(group, sender, groupMessage, "dave", "dave-key").cipherData, undefined);
});

test("a message too long for a push goes with the names alone", () => {
  const long = { ...directMessage, cipher: { ...directMessage.cipher, data: "x".repeat(5000) } };
  const data = pushDataFor(direct, sender, long, "bob", "bob-key");
  assert.equal(data.cipherData, undefined);
  assert.equal(data.title, "Alice Reed");
});

test("a file and a view-once file say so, so the phone reads them as files", () => {
  assert.equal(pushDataFor(direct, sender, { ...directMessage, attachment: { status: "uploading" } }, "bob", "bob-key").kind, "file");
  assert.equal(pushDataFor(direct, sender, { ...directMessage, attachment: {}, viewOnce: true }, "bob", "bob-key").kind, "view-once");
});

test("a disappearing message says when it goes, so a phone keeping it never shows it after", () => {
  const expiresAt = new Date("2026-10-26T09:30:00.000Z");
  assert.equal(pushDataFor(direct, sender, { ...directMessage, expiresAt }, "bob", "bob-key").expiresAt, "2026-10-26T09:30:00.000Z");
  assert.equal(pushDataFor(direct, sender, directMessage, "bob", "bob-key").expiresAt, undefined);
});
