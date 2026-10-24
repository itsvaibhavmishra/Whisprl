import { fetchJson } from "#src/utils/fetchJson.js";

// Debounce's answer is a string, and a failed check lets the address through rather than blocking sign up
export const isDisposableEmail = async (email) => {
  try {
    const data = await fetchJson("https://disposable.debounce.io/", { query: { email }, signal: AbortSignal.timeout(5000) });
    return data.disposable === "true";
  } catch (error) {
    console.error("Error while checking disposable email:", error.message);
    return false;
  }
};
