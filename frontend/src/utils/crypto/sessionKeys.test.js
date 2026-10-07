/**
 * @jest-environment node
 */
import { createPublicKey, verify, webcrypto } from "crypto";

import { createSessionKeys, signChallenge } from "@/utils/crypto/sessionKeys";

// Jest's Node environment predates the global Web Crypto that browsers and current Node have
globalThis.crypto ??= webcrypto;

// checked the way the server checks it, so the browser and the server agree on the key and signature formats
const serverAccepts = (encodedPublicKey, challenge, signature) =>
  verify(
    "sha256",
    Buffer.from(challenge),
    { key: createPublicKey({ key: Buffer.from(encodedPublicKey, "base64"), format: "der", type: "spki" }), dsaEncoding: "ieee-p1363" },
    Buffer.from(signature, "base64")
  );

test("the server accepts a challenge signed with the session's key", async () => {
  const { privateKey, encodedPublicKey } = await createSessionKeys();
  expect(serverAccepts(encodedPublicKey, "a challenge", await signChallenge(privateKey, "a challenge"))).toBe(true);
});

test("a signature for another challenge or from another key is refused", async () => {
  const mine = await createSessionKeys();
  const theirs = await createSessionKeys();
  const signature = await signChallenge(mine.privateKey, "a challenge");

  expect(serverAccepts(mine.encodedPublicKey, "another challenge", signature)).toBe(false);
  expect(serverAccepts(theirs.encodedPublicKey, "a challenge", signature)).toBe(false);
});

test("the private key can never be exported", async () => {
  const { privateKey } = await createSessionKeys();

  expect(privateKey.extractable).toBe(false);
  await expect(crypto.subtle.exportKey("pkcs8", privateKey)).rejects.toThrow();
});
