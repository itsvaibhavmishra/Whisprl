import { alpha } from "@mui/material/styles";

import cats from "@/assets/covers/cats.svg";
import sky from "@/assets/covers/sky.svg";
import whispers from "@/assets/covers/whispers.svg";
import { colorPresets } from "@/utils/colorPresets";

// the backend keeps the same ids in src/utils/coverStyles.js
export const COVER_PATTERNS = [
  { id: "cats", label: "Cats", tile: cats },
  { id: "whispers", label: "Whispers", tile: whispers },
  { id: "sky", label: "Night sky", tile: sky },
  { id: "plain", label: "Plain", tile: null },
];

const accentNamed = (label) => colorPresets.find((preset) => preset.label === label);

// a cover takes its accent's bubble gradient by day, and the same hues kept deep at night so it never outshines the page
const fromAccent = (label, night) => ({ id: label.toLowerCase(), label, day: accentNamed(label).bubble, night, glow: accentNamed(label).glow });

export const COVER_PALETTES = [
  fromAccent("Halo", ["#0F3957", "#192557"]),
  fromAccent("Violet", ["#281650", "#512044"]),
  fromAccent("Lagoon", ["#11554F", "#183A58"]),
  fromAccent("Cobalt", ["#162550", "#2C1C54"]),
  fromAccent("Sunset", ["#5A2A12", "#561A29"]),
  fromAccent("Rose", ["#4F1724", "#401C55"]),
  { id: "midnight", label: "Midnight", day: ["#1E2A3D", "#0F1A2B"], night: ["#1B2638", "#121B2B"], glow: "#22D3EE", ink: "#C8D6EC" },
];

// an account is only ever given a doodle in an accent colour; Plain and Midnight are for picking
export const GIVEN_PATTERNS = COVER_PATTERNS.filter((pattern) => pattern.tile);
export const GIVEN_PALETTES = COVER_PALETTES.filter((palette) => palette.id !== "midnight");

// every account has a style, so this only shows while a profile saved before covers is fetched again
const BEFORE_LOADING = { pattern: "cats", palette: "halo" };

export const coverStyleOf = (profile) => profile.coverStyle ?? BEFORE_LOADING;

export const patternById = (id) => COVER_PATTERNS.find((pattern) => pattern.id === id) ?? COVER_PATTERNS[0];
export const paletteById = (id) => COVER_PALETTES.find((palette) => palette.id === id) ?? COVER_PALETTES[0];

// a small preview draws the doodles darker, or at that size they fade into the ground
export const coverColorsOf = (paletteId, isNight, isPreview = false) => {
  const palette = paletteById(paletteId);
  const [from, to] = isNight ? palette.night : palette.day;
  const boost = isPreview ? 0.1 : 0;
  return {
    ground: `radial-gradient(120% 160% at 92% -10%, ${alpha(palette.glow, isNight ? 0.3 : 0.45)}, transparent 55%), linear-gradient(135deg, ${from}, ${to})`,
    ink: palette.ink ? alpha(palette.ink, (isNight ? 0.16 : 0.2) + boost) : alpha(isNight ? palette.glow : "#fff", 0.18 + boost),
  };
};

export const swatchOf = (palette) => `linear-gradient(135deg, ${palette.day[0]}, ${palette.day[1]})`;
