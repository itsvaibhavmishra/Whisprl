import { Box, Button, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { HandshakeIcon } from "@phosphor-icons/react";

import { firstNameIn } from "@/utils/groups";

const riseIn = keyframes`
  from { transform: translateY(16px); opacity: 0; }
  to { transform: none; opacity: 1; }
`;

// asked of the other player near the foot of their screen, over the board, and shown to the one waiting on it
const DrawOffer = ({ offeredBy, opponent, conversation, meId, theme, onAnswer }) => {
  const isMine = offeredBy === meId;
  const name = firstNameIn(conversation, opponent, meId);

  return (
    <Box
      role={isMine ? "status" : "alertdialog"}
      aria-label={isMine ? undefined : `${name} offers a draw`}
      sx={{
        position: "absolute",
        zIndex: 5,
        left: 16,
        right: 16,
        bottom: { xs: "calc(var(--chat-overlay, 200px) + 12px)", lg: 16 },
        maxWidth: 440,
        mx: "auto",
        px: 2,
        py: 1.5,
        borderRadius: 4,
        bgcolor: theme.card,
        color: theme.ink,
        backdropFilter: "blur(10px)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
        animation: `${riseIn} 260ms ease-out`,
        "@media (prefers-reduced-motion: reduce)": { animation: "none" },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <HandshakeIcon size={26} weight="duotone" />
        <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{isMine ? `Draw offered to ${name}` : `${name} offers a draw`}</Typography>
        {!isMine && (
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button size="small" onClick={() => onAnswer(false)} sx={{ color: theme.ink, fontWeight: 700 }}>
              Play on
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => onAnswer(true)}
              sx={{ bgcolor: theme.accent, color: "#fff", fontWeight: 700, borderRadius: 99 }}
            >
              Accept
            </Button>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default DrawOffer;
