import { useId } from "react";
import { m, useReducedMotion } from "motion/react";

import art from "@/sections/chat/game/games/chain-reaction/art";
import EnergyOrb, { EnergyDefs } from "@/sections/chat/game/games/chain-reaction/EnergyOrb";
import layout from "@/sections/chat/game/games/chain-reaction/masthead.json";
import { OrbDefs } from "@/sections/chat/game/games/chain-reaction/Orb";

// far enough out that the clip covers a whole ring and its glow
const BEYOND = 2000;
const DROP = { default: { type: "spring", stiffness: 420, damping: 26, delay: 0.3 }, opacity: { duration: 0.22, delay: 0.3, ease: "easeOut" } };

const spin = (from, turn, seconds) => (
  <animateTransform attributeName="transform" type="rotate" from={from} to={from + 360 * turn} dur={`${seconds}s`} repeatCount="indefinite" />
);

// an orb rides its ring, turned back as the ring turns and unsquashed after it, so it stays round and upright all the way round
const Rider = ({ ring, orb, seed, prefix, isStill }) => (
  <g transform={isStill ? `rotate(${orb.start})` : undefined}>
    {!isStill && spin(orb.start, ring.turn, ring.seconds)}
    <g transform={`translate(${ring.radius} 0)`}>
      <g transform={isStill ? `rotate(${-orb.start})` : undefined}>
        {!isStill && spin(-orb.start, -ring.turn, ring.seconds)}
        <g transform={`scale(1 ${1 / ring.squash}) rotate(${-ring.tilt})`}>
          <EnergyOrb prefix={prefix} tone={orb.tone} radius={orb.radius} seed={seed} isStill={isStill} />
        </g>
      </g>
    </g>
  </g>
);

// a ring is drawn in two halves, the far one behind the logo and the near one in front, which is what makes it read as an orbit
const Ring = ({ ring, prefix, half, isStill }) => (
  <g transform={`translate(${ring.x} ${ring.y}) rotate(${ring.tilt}) scale(1 ${ring.squash})`}>
    <g clipPath={`url(#${prefix}-${half})`}>
      <circle r={ring.radius} fill="none" stroke="rgba(150, 110, 255, 0.22)" strokeWidth={6} vectorEffect="non-scaling-stroke" />
      <circle r={ring.radius} fill="none" stroke="rgba(214, 196, 255, 0.6)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
      {ring.orbs.map((orb, index) => (
        <Rider key={orb.start} ring={ring} orb={orb} seed={ring.seed + index} prefix={prefix} isStill={isStill} />
      ))}
    </g>
  </g>
);

// the logo inside its two rings, orbiting on the start screen and held still in the game's bar
const Wordmark = ({ isStatic = false, isReady = true, width, x, y }) => {
  const prefix = `wm${useId().replace(/:/g, "")}`;
  const isStill = useReducedMotion() || isStatic;
  const { wordmark, logo } = layout;
  // nested in the masthead's drawing it needs its height in the masthead's units; standing alone the browser works it out
  const isNested = x !== undefined;

  return (
    <svg
      viewBox={`${wordmark.x} ${wordmark.y} ${wordmark.width} ${wordmark.height}`}
      x={x}
      y={y}
      width={width}
      height={isNested ? wordmark.height : undefined}
      role="img"
      aria-label="Chain Reaction"
      style={{ overflow: "visible", display: "block" }}
    >
      <OrbDefs prefix={prefix} />
      <EnergyDefs prefix={prefix} />
      <defs>
        <clipPath id={`${prefix}-far`} clipPathUnits="userSpaceOnUse">
          <rect x={-BEYOND} y={-BEYOND} width={BEYOND * 2} height={BEYOND} />
        </clipPath>
        <clipPath id={`${prefix}-near`} clipPathUnits="userSpaceOnUse">
          <rect x={-BEYOND} y={0} width={BEYOND * 2} height={BEYOND} />
        </clipPath>
      </defs>
      {layout.rings.map((ring) => (
        <Ring key={ring.radius} ring={ring} prefix={prefix} half="far" isStill={isStill} />
      ))}
      <m.g
        initial={isStill ? false : { y: -90, opacity: 0 }}
        animate={isReady ? { y: 0, opacity: 1 } : { y: -90, opacity: 0 }}
        transition={isStill ? { duration: 0 } : DROP}
      >
        <image href={art.logo} width={logo.width} height={logo.height} transform={`matrix(${logo.matrix.join(" ")})`} />
      </m.g>
      {layout.rings.map((ring) => (
        <Ring key={ring.radius} ring={ring} prefix={prefix} half="near" isStill={isStill} />
      ))}
    </svg>
  );
};

export default Wordmark;
