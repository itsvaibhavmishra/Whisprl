import { decryptBytes, deriveSecretKey, encryptBytes, exportPrivateKey, importPrivateKey } from "@/utils/crypto/keys";

export const wrapPrivateKey = async (privateKey, secret, keyId, purpose) =>
  encryptBytes(await deriveSecretKey(secret, purpose), await exportPrivateKey(privateKey), keyId);

export const unwrapPrivateKey = async (backup, secret, purpose) =>
  importPrivateKey(await decryptBytes(await deriveSecretKey(secret, purpose), backup, backup.keyId));
