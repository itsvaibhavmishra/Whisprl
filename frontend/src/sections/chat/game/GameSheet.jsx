import { useEffect, useRef } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { XIcon } from "@phosphor-icons/react";

import useScreenBack from "@/hooks/useScreenBack";

const GameSheet = ({ theme, title, onClose, children }) => {
  const cardRef = useRef(null);
  useScreenBack(onClose);

  // a sheet whose content takes focus itself, such as pages that scroll by arrow key, keeps it
  useEffect(() => {
    if (!cardRef.current?.contains(document.activeElement)) cardRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <Box
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 6,
        display: "grid",
        placeItems: "center",
        // a row sized to the sheet rather than to the card, so the card's maxHeight holds on a short screen
        gridTemplate: "minmax(0, 1fr) / minmax(0, 1fr)",
        p: 2,
        // a phone's chat bar lies over the game's foot, so the sheet keeps above it
        pt: { xs: "calc(env(safe-area-inset-top) + 16px)", lg: 2 },
        pb: { xs: "calc(var(--chat-overlay, 0px) + 16px)", lg: 2 },
        bgcolor: `rgba(${theme.shade}, 0.6)`,
      }}
    >
      <Stack
        ref={cardRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        sx={{
          width: "100%",
          maxWidth: 420,
          maxHeight: "100%",
          py: 2,
          borderRadius: 5,
          outline: "none",
          // a theme's card is see-through, so it sits on the game's surface to keep the screen behind out of the text
          background: `linear-gradient(${theme.card}, ${theme.card}), ${theme.surface}`,
          boxShadow: "0 18px 50px rgba(0, 0, 0, 0.4)",
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", px: 3, pr: 1.5, mb: 1.5 }}>
          <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 800, color: alpha(theme.ink, 0.6) }}>{title}</Typography>
          <IconButton aria-label="Close" onClick={onClose} sx={{ color: theme.ink }}>
            <XIcon size={20} weight="bold" />
          </IconButton>
        </Stack>
        {children}
      </Stack>
    </Box>
  );
};

export default GameSheet;
