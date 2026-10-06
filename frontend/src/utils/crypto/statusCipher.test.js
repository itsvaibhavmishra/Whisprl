/**
 * @jest-environment node
 */
import { webcrypto } from "crypto";

import { exportPublicKey, generateAccountKeys, keyIdOf } from "@/utils/crypto/keys";
import { setDeviceKeys } from "@/utils/crypto/messageCipher";
import { encryptStatus, openStatus } from "@/utils/crypto/statusCipher";

// Jest's Node environment predates the global Web Crypto that browsers and current Node have
globalThis.crypto ??= webcrypto;

const makePerson = async (id) => {
  const keys = await generateAccountKeys();
  const publicKey = await exportPublicKey(keys.publicKey);
  const keyId = await keyIdOf(publicKey);
  return { device: { keyId, privateKey: keys.privateKey }, member: { _id: id, publicKeys: [{ keyId, publicKey }] } };
};

let alice;
let bob;
let carol;

beforeEach(async () => {
  [alice, bob, carol] = await Promise.all(["alice", "bob", "carol"].map(makePerson));
});

const postAsAlice = async (content, sealedFor) => {
  setDeviceKeys(alice.device);
  return { owner: alice.member, cipher: await encryptStatus(content, sealedFor, "alice") };
};

test("a friend it was sealed for, and its owner, can open a status", async () => {
  const status = await postAsAlice({ kind: "text", text: "at the beach 🌊" }, [alice.member, bob.member]);

  setDeviceKeys(bob.device);
  expect(await openStatus(status)).toEqual({ kind: "text", text: "at the beach 🌊" });
  setDeviceKeys(alice.device);
  expect((await openStatus(status)).text).toBe("at the beach 🌊");
});

test("a friend it is hidden from cannot open it", async () => {
  const status = await postAsAlice({ kind: "text", text: "not for carol" }, [alice.member, bob.member]);

  setDeviceKeys(carol.device);
  await expect(openStatus(status)).rejects.toThrow();
});

test("a status the server passes off as someone else's does not open", async () => {
  const status = await postAsAlice({ kind: "text", text: "from alice" }, [alice.member, bob.member, carol.member]);

  setDeviceKeys(bob.device);
  await expect(openStatus({ ...status, owner: carol.member })).rejects.toThrow();
});
