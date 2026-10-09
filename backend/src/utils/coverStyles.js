import crypto from "crypto";
import createHttpError from "http-errors";

export const COVER_PATTERNS = ["cats", "whispers", "sky", "plain"];
export const COVER_PALETTES = ["halo", "violet", "lagoon", "cobalt", "sunset", "rose", "midnight"];

// Plain and Midnight are quiet looks someone picks, so an account is only ever given a doodle in an accent colour
const GIVEN_PATTERNS = COVER_PATTERNS.filter((pattern) => pattern !== "plain");
const GIVEN_PALETTES = COVER_PALETTES.filter((palette) => palette !== "midnight");

const pick = (choices) => choices[crypto.randomInt(choices.length)];

export const randomCoverStyle = () => ({ pattern: pick(GIVEN_PATTERNS), palette: pick(GIVEN_PALETTES) });

export const assertCoverStyle = (pattern, palette) => {
  if (!COVER_PATTERNS.includes(pattern) || !COVER_PALETTES.includes(palette)) {
    throw createHttpError.BadRequest("Choose a cover pattern and colour from the list");
  }
};
