import { createContext, useContext } from "react";
import { Box, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";

import ReactionEmoji from "@/sections/chat/game/ReactionEmoji";
import { FLOAT_MS } from "@/sections/chat/game/useRoomChatter";
import { firstNameIn } from "@/utils/groups";

const popIn = keyframes`
  from { transform: translate(-50%, -6px) scale(0.6); opacity: 0; }
  to { transform: translate(-50%, 0) scale(1); opacity: 1; }
`;

const popOut = keyframes`
  from { transform: translate(-6px, -50%) scale(0.6); opacity: 0; }
  to { transform: translate(0, -50%) scale(1); opacity: 1; }
`;

// below the seat, its tail pointing up, or beside it, its tail pointing back at the name
const PLACEMENTS = {
  below: {
    box: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", animation: `${popIn} 200ms ease-out` },
    tail: (colour) => ({
      top: -6,
      left: "50%",
      ml: "-6px",
      borderLeft: "6px solid transparent",
      borderRight: "6px solid transparent",
      borderBottom: `6px solid ${colour}`,
    }),
  },
  beside: {
    box: { top: "50%", left: "calc(100% + 10px)", transform: "translateY(-50%)", animation: `${popOut} 200ms ease-out` },
    tail: (colour) => ({
      left: -6,
      top: "50%",
      mt: "-6px",
      borderTop: "6px solid transparent",
      borderBottom: "6px solid transparent",
      borderRight: `6px solid ${colour}`,
    }),
  },
};

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

const coverIn = keyframes`
  from { transform: scale(0.6); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

// an emoji thrown by a seated player covers their face for a moment, over a dark blur so it reads on any picture
export const AvatarReaction = ({ user, size }) => {
  const saying = useContext(SayingsContext)[user];
  if (!saying?.emoji) return null;
  return (
    <Box
      key={saying.id}
      role="status"
      sx={{
        position: "absolute",
        inset: 0,
        zIndex: 3,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        bgcolor: "rgba(12, 8, 20, 0.5)",
        backdropFilter: "blur(5px)",
        WebkitBackdropFilter: "blur(5px)",
        pointerEvents: "none",
        animation: `${coverIn} 200ms ease-out`,
        ...STILL,
      }}
    >
      <ReactionEmoji emoji={saying.emoji} size={Math.round(size * 0.86)} />
    </Box>
  );
};

// words said at the table sit beside the seat; a thrown emoji covers the face instead
export const SeatSaying = ({ user, theme, placement = "below" }) => {
  const { box, tail } = PLACEMENTS[placement];
  const saying = useContext(SayingsContext)[user];
  return saying && !saying.emoji ? (
    <Box
      key={saying.id}
      role="status"
      sx={{
        position: "absolute",
        zIndex: 3,
        maxWidth: 200,
        width: "max-content",
        px: 1.5,
        py: 0.75,
        borderRadius: 3,
        bgcolor: theme.card,
        color: theme.ink,
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.28)",
        pointerEvents: "none",
        ...box,
        ...STILL,
        "&::before": { content: '""', position: "absolute", ...tail(theme.card) },
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1.35,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordBreak: "break-word",
        }}
      >
        {saying.text}
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
            {float.emoji ? <ReactionEmoji emoji={float.emoji} size={28} /> : float.text}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>
);
