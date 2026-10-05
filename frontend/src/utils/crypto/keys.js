import { decodeText, encodeText, fromBase64, toBase64, toHex } from "@/utils/crypto/encoding";

const CURVE = { name: "ECDH", namedCurve: "P-256" };
const MESSAGE_KEY = { name: "AES-GCM", length: 256 };
const IV_BYTES = 12;

export const generateAccountKeys = () => crypto.subtle.generateKey(CURVE, true, ["deriveBits"]);

export const exportPublicKey = async (publicKey) => toBase64(await crypto.subtle.exportKey("raw", publicKey));

export const importPublicKey = (encoded) => crypto.subtle.importKey("raw", fromBase64(encoded), CURVE, true, []);

export const exportPrivateKey = (privateKey) => crypto.subtle.exportKey("pkcs8", privateKey);

export const importPrivateKey = (pkcs8) => crypto.subtle.importKey("pkcs8", pkcs8, CURVE, true, ["deriveBits"]);

export const keyIdOf = async (encodedPublicKey) =>
  toHex(await crypto.subtle.digest("SHA-256", fromBase64(encodedPublicKey))).slice(0, 16);

const hkdfKey = async (secret, salt, info) => {
  const material = await crypto.subtle.importKey("raw", secret, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: encodeText(salt), info: encodeText(info) },
    material,
    MESSAGE_KEY,
    false,
    ["encrypt", "decrypt"]
  );
};

export const deriveSecretKey = (secret, purpose) => hkdfKey(secret, "", purpose);

export const deriveConversationKey = async (privateKey, peerPublicKey, conversationId) => {
  const shared = await crypto.subtle.deriveBits({ name: "ECDH", public: peerPublicKey }, privateKey, 256);
  return hkdfKey(shared, conversationId, "whisprl message v1");
};

export const encryptBytes = async (key, bytes, context) => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encodeText(context) }, key, bytes);
  return { iv: toBase64(iv), data: toBase64(data) };
};

export const decryptBytes = (key, { iv, data }, context) =>
  crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(iv), additionalData: encodeText(context) }, key, fromBase64(data));

export const encryptText = (key, text, context) => encryptBytes(key, encodeText(text), context);

export const decryptText = async (key, sealed, context) => decodeText(await decryptBytes(key, sealed, context));
