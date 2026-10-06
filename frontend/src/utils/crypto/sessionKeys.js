import { encodeText, toBase64 } from "@/utils/crypto/encoding";

const SESSION_KEY = { name: "ECDSA", namedCurve: "P-256" };
const SIGNATURE = { name: "ECDSA", hash: "SHA-256" };

// the private half cannot be exported, so not even a script running in the page can take the session elsewhere
export const createSessionKeys = async () => {
  const { privateKey, publicKey } = await crypto.subtle.generateKey(SESSION_KEY, false, ["sign", "verify"]);
  return { privateKey, encodedPublicKey: toBase64(await crypto.subtle.exportKey("spki", publicKey)) };
};

export const signChallenge = async (privateKey, challenge) =>
  toBase64(await crypto.subtle.sign(SIGNATURE, privateKey, encodeText(challenge)));
