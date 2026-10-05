import { deriveSecretKey, encryptBytes, decryptBytes, exportPrivateKey, importPrivateKey } from "@/utils/crypto/keys";

// Crockford's base32 leaves out I, L, O and U, so a key copied by hand cannot be misread
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const KEY_BYTES = 15;
const KEY_LENGTH = (KEY_BYTES * 8) / 5;
const GROUP = 4;

const encodeBase32 = (bytes) => {
  let output = "";
  let buffered = 0;
  let bitCount = 0;
  bytes.forEach((byte) => {
    buffered = (buffered << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      bitCount -= 5;
      output += ALPHABET[(buffered >> bitCount) & 31];
    }
  });
  return output;
};

const decodeBase32 = (text) => {
  const bytes = [];
  let buffered = 0;
  let bitCount = 0;
  [...text].forEach((character) => {
    buffered = (buffered << 5) | ALPHABET.indexOf(character);
    bitCount += 5;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push((buffered >> bitCount) & 255);
    }
  });
  return new Uint8Array(bytes);
};

export const createRecoveryKey = () => {
  const encoded = encodeBase32(crypto.getRandomValues(new Uint8Array(KEY_BYTES)));
  return encoded.match(new RegExp(`.{${GROUP}}`, "g")).join("-");
};

export const parseRecoveryKey = (input) => {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
  const isValid = cleaned.length === KEY_LENGTH && [...cleaned].every((character) => ALPHABET.includes(character));
  return isValid ? decodeBase32(cleaned) : null;
};

const wrappingKeyFor = (recoveryBytes) => deriveSecretKey(recoveryBytes, "whisprl recovery key v1");

export const lockPrivateKey = async (privateKey, recoveryBytes, keyId) =>
  encryptBytes(await wrappingKeyFor(recoveryBytes), await exportPrivateKey(privateKey), keyId);

export const unlockPrivateKey = async (backup, recoveryBytes) =>
  importPrivateKey(await decryptBytes(await wrappingKeyFor(recoveryBytes), backup, backup.keyId));
