import crypto from "crypto";

const STRUCTURED = "\u0001";

// a written message marks its payload as structured content, while an attachment's is plain JSON
const payloadIn = (plaintext) => {
  const json = plaintext.startsWith(STRUCTURED) ? plaintext.slice(STRUCTURED.length) : plaintext;
  try {
    return JSON.parse(json) ?? {};
  } catch {
    return {};
  }
};

const frankingKeyIn = (plaintext) => payloadIn(plaintext).frankingKey ?? null;

export const textIn = (plaintext) => {
  const { text, caption } = payloadIn(plaintext);
  return String(text ?? caption ?? "");
};

// the key the sender sealed inside the message has to be the one that makes the fingerprint it sent in the clear
export const matchesFranking = (plaintext, franking) => {
  if (typeof plaintext !== "string" || !franking) return false;

  const key = frankingKeyIn(plaintext);
  if (!key) return false;

  const expected = crypto.createHmac("sha256", Buffer.from(key, "base64")).update(plaintext, "utf8").digest();
  const claimed = Buffer.from(franking, "base64");
  return expected.length === claimed.length && crypto.timingSafeEqual(expected, claimed);
};
