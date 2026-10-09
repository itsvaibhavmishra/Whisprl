/**
 * @jest-environment node
 */
import { webcrypto } from "crypto";

import { exportPublicKey, generateAccountKeys, keyIdOf } from "@/utils/crypto/keys";
import { openMessage, setDeviceKeys } from "@/utils/crypto/messageCipher";
import { openNote, sealNote } from "@/utils/crypto/noteCipher";

globalThis.crypto ??= webcrypto;

const makePerson = async (id) => {
  const keys = await generateAccountKeys();
  const publicKey = await exportPublicKey(keys.publicKey);
  const keyId = await keyIdOf(publicKey);
  return { device: { keyId, privateKey: keys.privateKey }, member: { _id: id, publicKeys: [{ keyId, publicKey }] } };
};

const CHAT_ID = "64b000000000000000000001";

let alice;
let bob;

beforeEach(async () => {
  [alice, bob] = await Promise.all(["alice", "bob"].map(makePerson));
  setDeviceKeys(alice.device);
});

const aliceAsksBob = async (text, conversationId = CHAT_ID) => {
  setDeviceKeys(alice.device);
  return { note: await sealNote(text, { conversationId, meId: "alice", recipient: bob.member }), conversationId };
};

test("the person asked can read the note, and so can its sender", async () => {
  const request = await aliceAsksBob("Hi Bob, it's Alice from the climbing club 🧗");

  setDeviceKeys(bob.device);
  expect(await openNote({ ...request, person: alice.member }, { meId: "bob", isMine: false })).toBe("Hi Bob, it's Alice from the climbing club 🧗");
  setDeviceKeys(alice.device);
  expect(await openNote({ ...request, person: bob.member }, { meId: "alice", isMine: true })).toBe("Hi Bob, it's Alice from the climbing club 🧗");
});

test("once accepted, the same sealed note opens as the first message of their chat", async () => {
  const { note } = await aliceAsksBob("see you at the meetup");
  const chat = { _id: CHAT_ID, isGroup: false, users: [alice.member, bob.member] };

  setDeviceKeys(bob.device);
  expect(await openMessage({ cipher: note, sender: "alice" }, chat)).toBe("see you at the meetup");
});

test("a note moved into any other chat does not open", async () => {
  const { note } = await aliceAsksBob("only for our chat");

  setDeviceKeys(bob.device);
  await expect(openNote({ note, conversationId: "64b000000000000000000002", person: alice.member }, { meId: "bob", isMine: false })).rejects.toThrow();
});
