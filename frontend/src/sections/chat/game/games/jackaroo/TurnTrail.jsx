import { useLayoutEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { m } from "motion/react";

import { BOARD, shownSeatOf } from "@/sections/chat/game/games/jackaroo/geometry";

// the server's jackaroo/pace.js hand-over: once a play has shown, the trail runs this long and the next turn starts as it arrives
const HAND_OVER_MS = 900;
const TRAVEL_MS = 600;
const TWINKLE_MS = HAND_OVER_MS - TRAVEL_MS;
const SPARKS_A_QUARTER = 9;
const MIDDLE = BOARD / 2;

const baseCentreOf = (layout, shown) => {
  const slots = layout.bases[shown];
  return { x: slots.reduce((sum, slot) => sum + slot.x, 0) / slots.length, y: slots.reduce((sum, slot) => sum + slot.y, 0) / slots.length };
};

const polarOf = ({ x, y }) => ({ angle: Math.atan2(y - MIDDLE, x - MIDDLE), radius: Math.hypot(x - MIDDLE, y - MIDDLE) });

// round the board the way turns pass, counter-clockwise, so a turn that skips a seat sweeps past that seat's corner too
const sparksAround = (from, to) => {
  const start = polarOf(from);
  const end = polarOf(to);
  const turn = (((start.angle - end.angle) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) || 2 * Math.PI;
  const count = Math.max(4, Math.round((turn / (Math.PI / 2)) * SPARKS_A_QUARTER));
  return Array.from({ length: count }, (_, index) => {
    const share = (index + 1) / count;
    const angle = start.angle - turn * share;
    const radius = start.radius + (end.radius - start.radius) * share + (((index * 37) % 7) - 3) * 3;
    return {
      x: MIDDLE + Math.cos(angle) * radius,
      y: MIDDLE + Math.sin(angle) * radius,
      size: 9 + ((index * 53) % 5) * 2,
      delay: share * TRAVEL_MS,
    };
  });
};

// a four-pointed star, pinched in at its middle like a glint of light
const starAt = ({ x, y, size }) => {
  const waist = size * 0.22;
  return `M${x} ${y - size} Q${x + waist} ${y - waist} ${x + size} ${y} Q${x + waist} ${y + waist} ${x} ${y + size} Q${x - waist} ${y + waist} ${x - size} ${y} Q${x - waist} ${y - waist} ${x} ${y - size}Z`;
};

// a light trail of gold sparkles over the board, from the base of the player whose turn ended round to the base of the one whose turn begins
const TurnTrail = ({ turn, startsAt, view, isStill }) => {
  const lastTurn = useRef(turn);
  const [trail, setTrail] = useState(null);

  useLayoutEffect(() => {
    if (turn === null) return;
    const from = lastTurn.current;
    lastTurn.current = turn;
    if (isStill || from === null || from === turn) return;
    const leaving = baseCentreOf(view.layout, shownSeatOf(from, view));
    const arriving = baseCentreOf(view.layout, shownSeatOf(turn, view));
    const wait = Math.max(0, startsAt - HAND_OVER_MS - Date.now());
    setTrail({ key: `${from}>${turn}@${startsAt}`, wait, sparks: sparksAround(leaving, arriving) });
  }, [turn, startsAt, view, isStill]);

  if (!trail) return null;
  const last = trail.sparks.length - 1;
  return (
    <Box
      component="svg"
      viewBox={`0 0 ${BOARD} ${BOARD}`}
      aria-hidden
      sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", pointerEvents: "none" }}
    >
      <g key={trail.key} style={{ filter: "drop-shadow(0 0 4px rgba(255, 214, 90, 0.95)) drop-shadow(0 0 10px rgba(255, 196, 40, 0.6))" }}>
        {trail.sparks.map((spark, index) => (
          <m.path
            key={index}
            d={starAt(spark)}
            fill="#fffbe8"
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 0.95, 0], scale: [0.3, 1.15, 0.4], rotate: [0, 45] }}
            transition={{ delay: (trail.wait + spark.delay) / 1000, duration: TWINKLE_MS / 1000, ease: "easeOut" }}
            style={{ transformOrigin: `${spark.x}px ${spark.y}px` }}
            onAnimationComplete={index === last ? () => setTrail((current) => (current?.key === trail.key ? null : current)) : undefined}
          />
        ))}
      </g>
    </Box>
  );
};

export default TurnTrail;
