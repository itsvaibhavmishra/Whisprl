export const encodeText = (text) => new TextEncoder().encode(text);

export const decodeText = (bytes) => new TextDecoder().decode(bytes);

// String.fromCharCode takes its bytes as arguments, so a large buffer goes in slices
const SLICE = 0x8000;

export const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let start = 0; start < bytes.length; start += SLICE) {
    binary += String.fromCharCode(...bytes.subarray(start, start + SLICE));
  }
  return btoa(binary);
};

export const fromBase64 = (encoded) => Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));

export const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
