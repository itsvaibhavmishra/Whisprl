/**
 * @jest-environment node
 */
import { webcrypto } from "crypto";

import { openFile, sealFile } from "@/utils/crypto/fileCipher";

// Jest's Node environment predates the global Web Crypto that browsers and current Node have
globalThis.crypto ??= webcrypto;

const bytesOf = (text) => new TextEncoder().encode(text);
const textOf = (buffer) => new TextDecoder().decode(buffer);

test("a sealed file opens with its own key and is unreadable without it", async () => {
  const sealed = await sealFile(bytesOf("a holiday photo"));

  expect(textOf(sealed.data)).not.toContain("holiday");
  expect(textOf(await openFile(sealed.data, sealed))).toBe("a holiday photo");
});

test("another file's key or a changed byte is refused", async () => {
  const sealed = await sealFile(bytesOf("a holiday photo"));
  const other = await sealFile(bytesOf("something else"));
  const tampered = new Uint8Array(sealed.data);
  tampered[0] ^= 1;

  await expect(openFile(sealed.data, { ...sealed, key: other.key })).rejects.toThrow();
  await expect(openFile(tampered.buffer, sealed)).rejects.toThrow();
});
