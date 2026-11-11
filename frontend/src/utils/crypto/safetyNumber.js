import { encodeText, fromBase64 } from "@/utils/crypto/encoding";

// Signal's scheme, hashed thousands of times so nobody can search for a key whose half happens to match
const VERSION = new Uint8Array([0, 0]);
const ROUNDS = 5200;
const GROUPS_PER_HALF = 6;
const BYTES_PER_GROUP = 5;

const joined = (...parts) => {
  const bytes = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  parts.reduce((offset, part) => {
    bytes.set(part, offset);
    return offset + part.length;
  }, 0);
  return bytes;
};

const groupAt = (hash, index) => {
  const value = Array.from(hash.slice(index * BYTES_PER_GROUP, (index + 1) * BYTES_PER_GROUP)).reduce((total, byte) => total * 256 + byte, 0);
  return String(value % 100000).padStart(5, "0");
};

const halfOf = async ({ userId, publicKey }) => {
  const key = fromBase64(publicKey);
  let hash = joined(VERSION, key, encodeText(userId));
  for (let round = 0; round < ROUNDS; round += 1) {
    hash = new Uint8Array(await crypto.subtle.digest("SHA-512", joined(hash, key)));
  }
  return Array.from({ length: GROUPS_PER_HALF }, (_, index) => groupAt(hash, index));
};

// the halves go in a fixed order, so both people see the same digits however they are passed in
export const safetyNumberOf = async (mine, theirs) => {
  const halves = await Promise.all([mine, theirs].map(halfOf));
  return halves.sort((one, other) => one.join("").localeCompare(other.join(""))).flat();
};
