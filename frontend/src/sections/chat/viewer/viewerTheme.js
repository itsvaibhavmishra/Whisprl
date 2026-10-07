import { alpha } from "@mui/material/styles";

// the viewer is always dark, whatever the app's theme, so the photo is the brightest thing in the room
export const VIEWER_ROOM = "#05070B";

// the chat glows through blurred with no text competing with the photo, and a light chat needs a heavier tint to stay as dark
export const frostedRoom = (theme) => ({
  bgcolor: alpha(VIEWER_ROOM, theme.palette.mode === "dark" ? 0.82 : 0.92),
  backdropFilter: "blur(28px) saturate(1.4)",
  "@media (prefers-reduced-transparency: reduce)": { bgcolor: VIEWER_ROOM, backdropFilter: "none" },
});

export const VIEWER_BUTTON = {
  width: 44,
  height: 44,
  color: "#fff",
  bgcolor: "rgba(255, 255, 255, 0.08)",
  transition: "background-color 160ms ease",
  "&:hover": { bgcolor: "rgba(255, 255, 255, 0.16)" },
  "&.Mui-focusVisible": { outline: "2px solid #fff", outlineOffset: 2 },
  "&.Mui-disabled": { color: "rgba(255, 255, 255, 0.3)" },
};
