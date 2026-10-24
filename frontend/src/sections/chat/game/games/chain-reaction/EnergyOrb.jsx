import { darken, lighten } from "@mui/material/styles";

import { boltPath, seeded } from "@/sections/chat/game/games/chain-reaction/lightning";
import PALETTE from "@/sections/chat/game/games/chain-reaction/palette";

const LIGHT = { mixBlendMode: "screen" };
const BOLTS = 3;
const GLOW = 2.6;
const SPARK = "M0 -1 L0.18 -0.18 L1 0 L0.18 0.18 L0 1 L-0.18 0.18 L-1 0 L-0.18 -0.18 Z";

// everything inside an orb is drawn on a sphere of radius one and scaled, so one clip serves every orb
export const EnergyDefs = ({ prefix }) => (
  <defs>
    <clipPath id={`${prefix}-inside`}>
      <circle r="1" />
    </clipPath>
    {PALETTE.map((colour, tone) => (
      <g key={colour}>
        {/* a bright core, a dark band inside the glass, then the rim catching the light */}
        <radialGradient id={`${prefix}-core-${tone}`} fx="42%" fy="40%">
          <stop offset="0" stopColor={lighten(colour, 0.88)} />
          <stop offset="0.36" stopColor={lighten(colour, 0.35)} />
          <stop offset="0.6" stopColor={colour} />
          <stop offset="0.78" stopColor={darken(colour, 0.35)} />
          <stop offset="0.9" stopColor={colour} />
          <stop offset="1" stopColor={lighten(colour, 0.55)} />
        </radialGradient>
        <radialGradient id={`${prefix}-bloom-${tone}`}>
          <stop offset="0.55" stopColor={lighten(colour, 0.6)} stopOpacity="1" />
          <stop offset="0.72" stopColor={colour} stopOpacity="0.75" />
          <stop offset="1" stopColor={colour} stopOpacity="0" />
        </radialGradient>
      </g>
    ))}
  </defs>
);

const spinning = (seconds, turn) => (
  <animateTransform attributeName="transform" type="rotate" from="0" to={360 * turn} dur={`${seconds}s`} repeatCount="indefinite" />
);

const flicker = (seconds, begin) => (
  <animate
    attributeName="opacity"
    values="0;1;0.35;1;0.6;0;0"
    keyTimes="0;0.06;0.14;0.24;0.38;0.5;1"
    dur={`${seconds}s`}
    begin={`${begin}s`}
    repeatCount="indefinite"
  />
);

// a glass sphere with lightning caught inside it: dark plasma turning one way, bolts flickering and turning the other
const EnergyOrb = ({ prefix, tone, radius, x: centreX = 0, y: centreY = 0, seed = 1, isStill = false }) => {
  const colour = PALETTE[tone];
  const random = seeded(seed);
  const bolts = Array.from({ length: BOLTS }, (_, bolt) => {
    const angle = (bolt / BOLTS) * Math.PI * 2 + random() * 1.2;
    const start = [(random() - 0.5) * 0.3, (random() - 0.5) * 0.3];
    return boltPath(random, start, [Math.cos(angle) * 0.95, Math.sin(angle) * 0.95], 5, 0.16);
  });

  return (
    <g transform={`translate(${centreX} ${centreY})`}>
      <circle r={radius * GLOW} fill={`url(#${prefix}-halo-${tone})`} style={LIGHT} />
      <circle r={radius * 1.45} fill={`url(#${prefix}-bloom-${tone})`} style={LIGHT} />
      <g transform={`scale(${radius})`}>
        <circle r="1" fill={`url(#${prefix}-core-${tone})`} />
        <g clipPath={`url(#${prefix}-inside)`}>
          <g>
            {!isStill && spinning(9 + seed, 1)}
            <ellipse cx="0.46" cy="0.3" rx="0.42" ry="0.22" fill={darken(colour, 0.55)} opacity="0.32" />
            <ellipse cx="-0.5" cy="-0.05" rx="0.22" ry="0.36" fill={darken(colour, 0.6)} opacity="0.28" />
            <ellipse cx="0.05" cy="-0.5" rx="0.36" ry="0.2" fill={lighten(colour, 0.5)} opacity="0.4" />
          </g>
          <g style={LIGHT}>
            {!isStill && spinning(6 + seed / 2, -1)}
            {bolts.map((path, bolt) => (
              <g key={path} opacity={isStill ? 0.8 : 0}>
                {!isStill && flicker(1.3 + bolt * 0.41 + seed * 0.07, bolt * 0.45 + seed * 0.23)}
                <path d={path} fill="none" stroke={lighten(colour, 0.5)} strokeWidth="0.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                <path d={path} fill="none" stroke="#FFFFFF" strokeWidth="0.07" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ))}
          </g>
        </g>
        <circle r="1" fill="none" stroke={lighten(colour, 0.65)} strokeWidth="0.06" opacity="0.85" />
        <ellipse cx="-0.36" cy="-0.44" rx="0.3" ry="0.18" fill="#FFFFFF" opacity="0.7" />
        <g transform="translate(0.62 -0.62) scale(0.38)" opacity={isStill ? 0.9 : 0} style={LIGHT}>
          {!isStill && <animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.7;0.8;1" dur={`${2.6 + seed * 0.4}s`} repeatCount="indefinite" />}
          <path d={SPARK} fill="#FFFFFF" />
        </g>
      </g>
    </g>
  );
};

export default EnergyOrb;
