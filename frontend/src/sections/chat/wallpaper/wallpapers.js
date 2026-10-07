import { alpha, useTheme } from "@mui/material/styles";

import useSettings from "@/hooks/useSettings";

// Aurora has no colours of its own: it takes them from the accent
export const WALLPAPERS = [
  { id: "aurora", label: "Aurora" },
  { id: "lagoon", label: "Lagoon", colors: ["#0B7F75", "#22D3EE", "#1F6FB8", "#3EE6CF"], night: ["#0B7F75", "#0E6F8F", "#1F6FB8", "#075E57"] },
  { id: "dusk", label: "Dusk", colors: ["#7444E0", "#C2399E", "#3E5BDB", "#F27D98"], night: ["#7444E0", "#9C2F86", "#3E5BDB", "#5229B8"] },
  { id: "ember", label: "Ember", colors: ["#C2560F", "#C8264B", "#F7A25E", "#8A2BC0"], night: ["#C2560F", "#A8203F", "#8A2BC0", "#933F08"] },
  { id: "meadow", label: "Meadow", colors: ["#3F7D20", "#16876A", "#9BD35A", "#2BC48A"], night: ["#3F7D20", "#16876A", "#2E6B3A", "#178A5E"] },
  { id: "plain", label: "Plain", colors: null, night: null },
];

export const wallpaperById = (id) => WALLPAPERS.find((wallpaper) => wallpaper.id === id) ?? WALLPAPERS[0];

// night keeps to deep tones, so the canvas always stays darker than the bubbles on it
export const colorsOf = (wallpaper, { primary, mode }) => {
  const isNight = mode === "dark";
  if (wallpaper.id !== "aurora") return isNight ? wallpaper.night : wallpaper.colors;
  const [from, to] = primary.bubble;
  return isNight ? [from, alpha(primary.glow, 0.5), to, alpha(from, 0.6)] : [from, primary.glow, to, primary.light];
};

export const useWallpaper = (conversationId) => {
  const { palette } = useTheme();
  const { wallpapers } = useSettings();
  const ownId = conversationId && wallpapers.chats[conversationId];
  const wallpaper = WALLPAPERS.find((candidate) => candidate.id === ownId) ?? wallpaperById(wallpapers.all);
  return { colors: colorsOf(wallpaper, palette), doodles: wallpapers.doodles };
};
