/**
 * @jest-environment node
 */
import { webcrypto } from "crypto";

import { exportPublicKey, generateAccountKeys, publicKeyOf } from "@/utils/crypto/keys";
import { safetyNumberOf } from "@/utils/crypto/safetyNumber";

globalThis.crypto ??= webcrypto;

const ALICE = { userId: "alice", publicKey: "BAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0A=" };
const BOB = { userId: "bob", publicKey: "BEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaW1xdXl9gYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXp7fH1+f4A=" };

describe("safetyNumberOf", () => {
  // worked out separately with Python's hashlib, so a change to the scheme cannot pass by agreeing with itself
  it("matches the reference digits", async () => {
    expect(await safetyNumberOf(ALICE, BOB)).toEqual([
      "49987",
      "16262",
      "21188",
      "33254",
      "92711",
      "23391",
      "52665",
      "18060",
      "13395",
      "61937",
      "65310",
      "11313",
    ]);
  });

  it("gives both people the same digits in the same order", async () => {
    expect(await safetyNumberOf(ALICE, BOB)).toEqual(await safetyNumberOf(BOB, ALICE));
  });

  it("changes when either key changes", async () => {
    const swapped = { ...BOB, publicKey: ALICE.publicKey };
    expect(await safetyNumberOf(ALICE, swapped)).not.toEqual(await safetyNumberOf(ALICE, BOB));
  });
});

describe("publicKeyOf", () => {
  it("gives back the public half of a private key", async () => {
    const { publicKey, privateKey } = await generateAccountKeys();
    expect(await publicKeyOf(privateKey)).toBe(await exportPublicKey(publicKey));
  });
});
