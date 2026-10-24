import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { m } from "motion/react";

const RADIUS = 16.5;

// drains once, in one linear animation, so the clock moves smoothly without a render every frame
const TurnRing = ({ endsAt, seconds, colour, gap = 5 }) => {
  const left = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const share = seconds ? Math.min(1, left / (seconds * 1000)) : 1;

  return (
    <Box
      component="svg"
      viewBox="0 0 36 36"
      aria-hidden
      sx={{
        position: "absolute",
        inset: -gap,
        width: `calc(100% + ${gap * 2}px)`,
        height: `calc(100% + ${gap * 2}px)`,
        transform: "rotate(-90deg) scaleY(-1)",
        pointerEvents: "none",
      }}
    >
      <circle cx={18} cy={18} r={RADIUS} fill="none" stroke={alpha(colour, 0.2)} strokeWidth={2.5} />
      <m.circle
        cx={18}
        cy={18}
        r={RADIUS}
        fill="none"
        stroke={colour}
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={{ pathLength: share }}
        animate={{ pathLength: 0 }}
        transition={{ duration: left / 1000, ease: "linear" }}
        style={{ transition: "stroke 300ms ease" }}
      />
    </Box>
  );
};

export default TurnRing;
