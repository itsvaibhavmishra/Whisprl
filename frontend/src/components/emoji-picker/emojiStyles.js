import { alpha } from "@mui/material/styles";

export const EMOJI_BUTTON = 36;

export const emojiButtonSx = {
  width: EMOJI_BUTTON,
  height: EMOJI_BUTTON,
  flexShrink: 0,
  display: "grid",
  placeItems: "center",
  p: 0,
  border: 0,
  borderRadius: 2,
  bgcolor: "transparent",
  color: "inherit",
  fontSize: 24,
  lineHeight: 1,
  cursor: "pointer",
};

export const tappableSx = { ...emojiButtonSx, "&:hover": { bgcolor: "action.hover" } };

export const markedSx = (theme) => ({
  bgcolor: alpha(theme.palette.primary.main, 0.2),
  boxShadow: `inset 0 0 0 1.5px ${alpha(theme.palette.primary.main, 0.7)}`,
});
