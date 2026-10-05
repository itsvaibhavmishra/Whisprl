import { fromBase64, toBase64 } from "@/utils/crypto/encoding";

const FILE_KEY = { name: "AES-GCM", length: 256 };
const IV_BYTES = 12;

// every file has a key of its own, which travels inside the message's encrypted content
export const sealFile = async (bytes) => {
  const key = await crypto.subtle.generateKey(FILE_KEY, true, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return { data, key: toBase64(await crypto.subtle.exportKey("raw", key)), iv: toBase64(iv) };
};

export const openFile = async (data, { key, iv }) => {
  const fileKey = await crypto.subtle.importKey("raw", fromBase64(key), FILE_KEY, false, ["decrypt"]);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(iv) }, fileKey, data);
};
