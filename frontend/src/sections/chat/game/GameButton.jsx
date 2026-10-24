import { Button } from "@mui/material";
import { alpha, lighten } from "@mui/material/styles";
import { GameControllerIcon } from "@phosphor-icons/react";

import { displayFontOf } from "@/sections/chat/game/gameFonts";

// a game with a display font sets its main action in it, larger, and the lettering carries it without an icon
const typeOf = (theme, isSmall) =>
  theme.fonts
    ? { fontFamily: displayFontOf(theme), fontSize: isSmall ? 19 : 20, fontWeight: 700, textTransform: "none" }
    : { fontSize: isSmall ? 13.5 : 14, fontWeight: 800 };

// the one filled action a screen offers, in the game's own accent
const GameButton = ({ theme, label, onClick, isDisabled = false, isQuiet = false, isSmall = false, isFull = false }) => (
  <Button
    variant="contained"
    fullWidth={isFull}
    disabled={isDisabled}
    startIcon={isDisabled || isQuiet || theme.fonts ? null : <GameControllerIcon size={18} weight="fill" />}
    onClick={onClick}
    sx={{
      py: isSmall ? 0.9 : 1.35,
      px: isSmall ? 3 : 2,
      minWidth: isSmall ? 150 : 0,
      borderRadius: 99,
      ...typeOf(theme, isSmall),
      ...(isQuiet
        ? { bgcolor: theme.card, color: theme.ink, boxShadow: "0 4px 14px rgba(70, 48, 110, 0.18)", "&:hover": { bgcolor: theme.card } }
        : {
            bgcolor: theme.accent,
            // lit from above, the way the buttons in the games' artwork are drawn
            backgroundImage: `linear-gradient(180deg, ${lighten(theme.accent, 0.14)} 0%, ${theme.accent} 100%)`,
            color: theme.onAccent ?? "#fff",
            boxShadow: `0 6px 18px ${alpha(theme.accent, 0.45)}`,
            "&:hover": { bgcolor: theme.accent, backgroundImage: `linear-gradient(180deg, ${lighten(theme.accent, 0.22)} 0%, ${theme.accent} 100%)` },
          }),
      "&.Mui-disabled": { bgcolor: alpha(theme.ink, 0.12), color: alpha(theme.ink, 0.6), boxShadow: "none" },
    }}
  >
    {label}
  </Button>
);

export default GameButton;
