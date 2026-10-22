import { createContext, useContext } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";

import { FLOAT_MS } from "@/sections/chat/game/useRoomChatter";
import { firstNameIn } from "@/utils/groups";

const popIn = keyframes`
  from { transform: translate(-50%, -6px) scale(0.6); opacity: 0; }
  to { transform: translate(-50%, 0) scale(1); opacity: 1; }
`;

// a layer as wide as the room crosses it, so the message inside travels the room's own width whatever that is
const drift = keyframes`
  0% { transform: translateX(100%); opacity: 0; }
  6% { opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translateX(-100%); opacity: 0; }
`;

const STILL = { "@media (prefers-reduced-motion: reduce)": { animation: "none" } };

// what each player just said, by user id, given by the room to whichever seats it draws
export const SayingsContext = createContext({});

export const SeatSaying = ({ user, theme }) => {
  const saying = useContext(SayingsContext)[user];
  return saying ? (
    <Box
      key={saying.id}
      role="status"
      sx={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: "50%",
        zIndex: 3,
        maxWidth: 200,
        width: "max-content",
        px: saying.emoji ? 1 : 1.5,
        py: saying.emoji ? 0.25 : 0.75,
        borderRadius: 3,
        bgcolor: theme.card,
        color: theme.ink,
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.28)",
        pointerEvents: "none",
        transform: "translateX(-50%)",
        animation: `${popIn} 200ms ease-out`,
        ...STILL,
        "&::before": {
          content: '""',
          position: "absolute",
          top: -6,
          left: "50%",
          ml: "-6px",
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderBottom: `6px solid ${theme.card}`,
        },
      }}
    >
      <Typography
        sx={{
          fontSize: saying.emoji ? 26 : 13,
          fontWeight: 700,
          lineHeight: 1.35,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordBreak: "break-word",
        }}
      >
        {saying.emoji ?? saying.text}
      </Typography>
    </Box>
  ) : null;
};

// nothing here takes a tap, so the board under a passing message still plays
export const Floats = ({ floats, conversation, meId, theme }) => (
  <Box aria-live="polite" sx={{ position: "absolute", inset: 0, zIndex: 5, overflow: "hidden", pointerEvents: "none" }}>
    {floats.map((float) => (
      <Box
        key={float.id}
        sx={{ position: "absolute", left: 0, right: 0, top: `${float.top * 100}%`, animation: `${drift} ${FLOAT_MS}ms linear forwards`, ...STILL }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 0.75,
            maxWidth: "80%",
            px: 1.5,
            py: 0.6,
            borderRadius: 99,
            bgcolor: alpha(theme.card, 0.82),
            color: theme.ink,
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
          }}
        >
          <Typography component="span" sx={{ fontSize: 12, fontWeight: 800, flexShrink: 0, color: alpha(theme.ink, 0.7) }}>
            {float.from === meId ? "You" : firstNameIn(conversation, float.from, meId)}
          </Typography>
          <Typography component="span" noWrap sx={{ fontSize: float.emoji ? 22 : 14, fontWeight: 600 }}>
            {float.emoji ?? float.text}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>
);
