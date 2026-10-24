import { Box, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import TypingDots from "@/components/TypingDots";
import { listOf } from "@/utils/groups";

const TYPING_BUBBLE_HEIGHT = 40;
// sized so its head stands a little taller than the bubble
const CAT_SIZE = 70;
// room above the bubble for the three quarters of the cat's head that peek over it
const PEEK_ROOM = 38;
// where the drawing sits mid-peek, and the line it never shows below, level with its chin then
const PEEK_TOP = PEEK_ROOM - 48;
const CHIN_LINE = PEEK_ROOM + 18;
// how far down a ducked cat sinks behind the bubble, leaving its ear tips showing
const DUCK = 35;
// the corner peek sits just in from the bubble's end, leaning past it
const CORNER = "calc(100% - 14px)";
const TILT = "rotate(14deg)";
const CYCLE = "3.6s";

// the cat peeks over the middle, ducks and creeps to the far corner, peeks again, then creeps back to where it began
const peek = keyframes`
  0% { left: 50%; transform: translate(-50%, ${DUCK}px); }
  12%, 40% { left: 50%; transform: translate(-50%, 0); }
  50% { left: 50%; transform: translate(-50%, ${DUCK}px); }
  58% { left: ${CORNER}; transform: translate(-50%, ${DUCK}px) ${TILT}; }
  68%, 88% { left: ${CORNER}; transform: translate(-50%, 5px) ${TILT}; }
  94% { left: ${CORNER}; transform: translate(-50%, ${DUCK}px) ${TILT}; }
  100% { left: 50%; transform: translate(-50%, ${DUCK}px); }
`;

const blink = keyframes`
  0%, 26%, 33%, 76%, 82%, 100% { transform: scaleY(1); }
  29%, 79% { transform: scaleY(0.1); }
`;

const HEAD = "M24 46 L27 20 Q28 16 31 18 L44 34 Q50 32 56 34 L69 18 Q72 16 73 20 L76 46 Q82 56 78 68 Q70 84 50 84 Q30 84 22 68 Q18 56 24 46 Z";
const STILL = { "@media (prefers-reduced-motion: reduce)": { animation: "none" } };

const PeekingCat = () => (
  // the bubble in front hides the cat along its own rounded outline, and nothing of it shows lower than its chin would
  <Box aria-hidden sx={{ position: "absolute", inset: 0, clipPath: `inset(-20px -60px calc(100% - ${CHIN_LINE}px) -20px)`, pointerEvents: "none" }}>
    <Box
      component="svg"
      viewBox="0 0 100 100"
      sx={{
        position: "absolute",
        top: PEEK_TOP,
        left: "50%",
        width: CAT_SIZE,
        height: CAT_SIZE,
        transformOrigin: "50% 107%",
        transform: "translate(-50%, 0)",
        animation: `${peek} ${CYCLE} cubic-bezier(0.3, 1.4, 0.5, 1) infinite`,
        ...STILL,
      }}
    >
      <Box
        component="path"
        d={HEAD}
        sx={(theme) => ({ fill: theme.palette.chat.bubbleIn, stroke: theme.palette.primary.main, strokeWidth: 3, strokeLinejoin: "round" })}
      />
      {[40, 60].map((eyeX) => (
        <Box component="g" key={eyeX} sx={{ transformBox: "fill-box", transformOrigin: "center", animation: `${blink} ${CYCLE} infinite`, ...STILL }}>
          <Box component="ellipse" cx={eyeX} cy={57} rx={4.5} ry={6} sx={(theme) => ({ fill: theme.palette.primary.main })} />
          <Box component="circle" cx={eyeX + 1.6} cy={54.8} r={1.5} sx={{ fill: "#fff" }} />
        </Box>
      ))}
    </Box>
  </Box>
);

const TypingBubble = ({ names, isGroup }) => (
  <Box
    role="status"
    aria-label={`${listOf(names)} ${names.length === 1 ? "is" : "are"} typing`}
    sx={{ position: "relative", width: "fit-content", pt: `${PEEK_ROOM}px` }}
  >
    <PeekingCat />
    <Stack
      direction="row"
      spacing={1}
      sx={{
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        minWidth: TYPING_BUBBLE_HEIGHT * 2,
        height: TYPING_BUBBLE_HEIGHT,
        px: 1.75,
        borderRadius: "18px 18px 18px 6px",
        bgcolor: "chat.bubbleIn",
        color: "primary.main",
        boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.chat.edge}, 0 1px 2px ${theme.palette.chat.shade}`,
      }}
    >
      {isGroup && <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>{listOf(names)}</Typography>}
      <TypingDots size={7} />
    </Stack>
  </Box>
);

export default TypingBubble;
