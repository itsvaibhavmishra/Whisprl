/**
 * @jest-environment node
 */
import { webcrypto } from "crypto";

import { exportPublicKey, generateAccountKeys, keyIdOf } from "@/utils/crypto/keys";
import { decryptAlbumReactions, decryptMessage, encryptMessage, encryptReaction, setDeviceKeys } from "@/utils/crypto/messageCipher";
import { encodePayload } from "@/utils/messagePayload";
import { createRecoveryKey, lockPrivateKey, parseRecoveryKey, unlockPrivateKey } from "@/utils/crypto/recoveryKey";

// Jest's Node environment predates the global Web Crypto that browsers and current Node have
globalThis.crypto ??= webcrypto;

const makePerson = async (id) => {
  const keys = await generateAccountKeys();
  const publicKey = await exportPublicKey(keys.publicKey);
  const keyId = await keyIdOf(publicKey);
  return { id, keys, keyId, member: { _id: id, publicKeys: [{ keyId, publicKey }] } };
};

const deviceOf = (person) => ({ keyId: person.keyId, privateKey: person.keys.privateKey });

let alice;
let bob;
let conversation;

beforeEach(async () => {
  alice = await makePerson("alice");
  bob = await makePerson("bob");
  conversation = { _id: "conversation-1", users: [alice.member, bob.member] };
});

const sendFromAlice = async (text) => {
  setDeviceKeys(deviceOf(alice));
  return { sender: { _id: "alice" }, cipher: await encryptMessage(text, conversation, "alice") };
};

test("the other person reads what was sent", async () => {
  const sent = await sendFromAlice("meet at 6? 🐱");
  setDeviceKeys(deviceOf(bob));
  expect((await decryptMessage(sent, conversation)).message).toBe("meet at 6? 🐱");
});

test("the sender reads their own message on another of their browsers", async () => {
  const sent = await sendFromAlice("note to future me");
  setDeviceKeys(deviceOf(alice));
  expect((await decryptMessage(sent, conversation)).message).toBe("note to future me");
});

test("the ciphertext does not contain the text", async () => {
  const { cipher } = await sendFromAlice("a secret");
  expect(atob(cipher.data)).not.toContain("a secret");
  expect(cipher.keyIds).toEqual([alice.keyId, bob.keyId]);
});

test("someone outside the conversation cannot read it", async () => {
  const sent = await sendFromAlice("just us");
  const mallory = await makePerson("mallory");
  setDeviceKeys(deviceOf(mallory));
  expect(await decryptMessage(sent, { ...conversation, users: [...conversation.users, mallory.member] })).toMatchObject({
    message: "",
    undecryptable: true,
  });
});

test("a message the server moves to another sender does not decrypt", async () => {
  const sent = await sendFromAlice("from alice");
  setDeviceKeys(deviceOf(bob));
  expect((await decryptMessage({ ...sent, sender: { _id: "bob" } }, conversation)).undecryptable).toBe(true);
});

test("a message the server moves to another conversation does not decrypt", async () => {
  const sent = await sendFromAlice("for this chat only");
  setDeviceKeys(deviceOf(bob));
  expect((await decryptMessage(sent, { ...conversation, _id: "conversation-2" })).undecryptable).toBe(true);
});

test("a message written before encryption is shown as it was", async () => {
  const legacy = { sender: { _id: "alice" }, message: "hello from 2024" };
  expect(await decryptMessage(legacy, conversation)).toBe(legacy);
});

test("a note to self works with one person", async () => {
  const selfChat = { _id: "self", users: [alice.member] };
  setDeviceKeys(deviceOf(alice));
  const sent = { sender: { _id: "alice" }, cipher: await encryptMessage("remember milk", selfChat, "alice") };
  expect((await decryptMessage(sent, selfChat)).message).toBe("remember milk");
});

test("friends still read old messages after someone resets their key", async () => {
  const sent = await sendFromAlice("before the reset");
  const aliceAgain = await makePerson("alice");
  const afterReset = {
    ...conversation,
    users: [{ _id: "alice", publicKeys: [...alice.member.publicKeys, ...aliceAgain.member.publicKeys] }, bob.member],
  };
  setDeviceKeys(deviceOf(bob));
  expect((await decryptMessage(sent, afterReset)).message).toBe("before the reset");
});

test("a message to a friend without a key waits, sealed to the sender, until it is re-encrypted", async () => {
  const waitingFor = { ...conversation, users: [alice.member, { _id: "bob", publicKeys: [] }] };
  setDeviceKeys(deviceOf(alice));
  const waiting = { sender: { _id: "alice" }, cipher: await encryptMessage("see you soon", waitingFor, "alice") };
  expect(waiting.cipher.keyIds).toEqual([alice.keyId, alice.keyId]);

  const readable = await decryptMessage(waiting, waitingFor);
  const resealed = { ...waiting, cipher: await encryptMessage(readable.message, conversation, "alice") };

  setDeviceKeys(deviceOf(bob));
  expect((await decryptMessage(waiting, conversation)).undecryptable).toBe(true);
  expect((await decryptMessage(resealed, conversation)).message).toBe("see you soon");
});

describe("recovery key", () => {
  test("is 24 characters in groups of four", () => {
    expect(createRecoveryKey()).toMatch(/^([0-9A-HJKMNP-TV-Z]{4}-){5}[0-9A-HJKMNP-TV-Z]{4}$/);
  });

  test("reads back however it was typed", () => {
    const recoveryKey = createRecoveryKey();
    const typed = recoveryKey.toLowerCase().replace(/-/g, " ").replace(/0/g, "o").replace(/1/g, "l");
    expect(parseRecoveryKey(typed)).toEqual(parseRecoveryKey(recoveryKey));
  });

  test("rejects anything that is not a recovery key", () => {
    expect(parseRecoveryKey("ABCD-EFGH")).toBeNull();
    expect(parseRecoveryKey("UUUU-UUUU-UUUU-UUUU-UUUU-UUUU")).toBeNull();
  });

  test("unlocks the private key it locked, and only that one", async () => {
    setDeviceKeys(deviceOf(bob));
    const sent = { sender: { _id: "bob" }, cipher: await encryptMessage("restored", conversation, "bob") };

    const recoveryKey = parseRecoveryKey(createRecoveryKey());
    const backup = { keyId: alice.keyId, ...(await lockPrivateKey(alice.keys.privateKey, recoveryKey, alice.keyId)) };
    setDeviceKeys({ keyId: alice.keyId, privateKey: await unlockPrivateKey(backup, recoveryKey) });
    expect((await decryptMessage(sent, conversation)).message).toBe("restored");

    await expect(unlockPrivateKey(backup, parseRecoveryKey(createRecoveryKey()))).rejects.toThrow();
  });
});

test("an attachment's caption and file details come back from its encrypted content", async () => {
  setDeviceKeys(deviceOf(alice));
  const file = { name: "beach.jpg", kind: "image", key: "a-file-key", iv: "an-iv" };
  const cipher = await encryptMessage(JSON.stringify({ caption: "look", file }), conversation, alice.id);

  setDeviceKeys(deviceOf(bob));
  const readable = await decryptMessage({ sender: { _id: alice.id }, cipher, attachment: { status: "uploading" } }, conversation);

  expect(readable).toEqual(expect.objectContaining({ message: "look", file }));
});

test("a group message opens for every member, and for nobody who was not in the group when it was sent", async () => {
  const carol = await makePerson("carol");
  const dave = await makePerson("dave");
  const group = { _id: "group-1", isGroup: true, users: [alice.member, bob.member, carol.member] };

  setDeviceKeys(deviceOf(alice));
  const cipher = await encryptMessage("dinner at eight", group, alice.id);
  const sent = { sender: { _id: alice.id }, cipher };

  expect(cipher.keys.map((sealed) => sealed.keyId).sort()).toEqual([alice.keyId, bob.keyId, carol.keyId].sort());
  expect((await decryptMessage(sent, group)).message).toBe("dinner at eight");

  setDeviceKeys(deviceOf(carol));
  expect((await decryptMessage(sent, group)).message).toBe("dinner at eight");

  setDeviceKeys(deviceOf(dave));
  const withDave = { ...group, users: [...group.users, dave.member] };
  expect((await decryptMessage(sent, withDave)).undecryptable).toBe(true);
});

test("a member who has left can still be read by those who stayed", async () => {
  const carol = await makePerson("carol");
  const group = { _id: "group-1", isGroup: true, users: [alice.member, bob.member, carol.member] };

  setDeviceKeys(deviceOf(carol));
  const cipher = await encryptMessage("bye all", group, carol.id);

  setDeviceKeys(deviceOf(bob));
  const afterCarolLeft = { ...group, users: [alice.member, bob.member], formerUsers: [carol.member] };
  expect((await decryptMessage({ sender: { _id: carol.id }, cipher }, afterCarolLeft)).message).toBe("bye all");
});

test("a shared contact and mentions come back from the encrypted content, and plain text stays plain", async () => {
  const contact = { _id: "carol", firstName: "Carol", lastName: "Lane" };
  const structured = await sendFromAlice(encodePayload({ text: "meet @Bob", mentions: ["bob"], contact }));
  const plain = await sendFromAlice(encodePayload({ text: "just words" }));
  setDeviceKeys(deviceOf(bob));
  expect(await decryptMessage(structured, conversation)).toMatchObject({ message: "meet @Bob", mentions: ["bob"], contact });
  expect((await decryptMessage(plain, conversation)).message).toBe("just words");
});

test("a reaction opens on its own message, and cannot be passed off as a message or moved to another", async () => {
  setDeviceKeys(deviceOf(alice));
  const cipher = await encryptReaction("🎉", { _id: "message-1" }, conversation, "alice");
  const reacted = { _id: "message-1", sender: { _id: "bob" }, reactions: [{ user: "alice", cipher }] };

  setDeviceKeys(deviceOf(bob));
  expect((await decryptMessage(reacted, conversation)).reactions).toEqual([{ user: "alice", emoji: "🎉" }]);
  expect((await decryptMessage({ ...reacted, _id: "message-2" }, conversation)).reactions).toEqual([]);
  expect((await decryptMessage({ sender: { _id: "alice" }, cipher }, conversation)).undecryptable).toBe(true);
});

test("a reaction to a group of photos opens as that group's, and never as another group's or a photo's", async () => {
  setDeviceKeys(deviceOf(alice));
  const cipher = await encryptReaction("🎉", { _id: "photo-1", batchId: "send-1" }, conversation, "alice", true);
  const album = { batchId: "send-1", sender: "bob", reactions: [{ user: "alice", cipher }] };

  setDeviceKeys(deviceOf(bob));
  expect(await decryptAlbumReactions(album, conversation)).toEqual([{ user: "alice", emoji: "🎉" }]);
  expect(await decryptAlbumReactions({ ...album, batchId: "send-2" }, conversation)).toEqual([]);
  expect((await decryptMessage({ _id: "photo-1", sender: { _id: "bob" }, reactions: [{ user: "alice", cipher }] }, conversation)).reactions).toEqual([]);
});

test("a reply carries the quoted message, decrypted alongside it", async () => {
  const original = { _id: "message-1", ...(await sendFromAlice("the original")) };
  const reply = { ...(await sendFromAlice("the reply")), replyTo: { ...original, sender: "alice" } };
  setDeviceKeys(deviceOf(bob));
  const read = await decryptMessage(reply, conversation);
  expect([read.message, read.replyTo.message]).toEqual(["the reply", "the original"]);
});
