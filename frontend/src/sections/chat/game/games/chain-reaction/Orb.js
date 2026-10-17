import { darken, lighten } from "@mui/material/styles";

import PALETTE from "@/sections/chat/game/games/chain-reaction/palette";

const GLOW = 1.9;

// the glow is a gradient fading to nothing rather than a blur, because a blur on every orb of a full board is too slow on a phone
export const OrbDefs = ({ prefix }) => (
  <defs>
    {PALETTE.map((colour, tone) => (
      <g key={colour}>
        <radialGradient id={`${prefix}-orb-${tone}`} cx="38%" cy="32%" r="72%">
          <stop offset="0" stopColor={lighten(colour, 0.85)} />
          <stop offset="0.3" stopColor={lighten(colour, 0.35)} />
          <stop offset="0.78" stopColor={colour} />
          <stop offset="1" stopColor={darken(colour, 0.22)} />
        </radialGradient>
        {/* brightest just outside the orb's edge, where it shows, and gone well before the halo ends */}
        <radialGradient id={`${prefix}-halo-${tone}`}>
          <stop offset="0" stopColor={colour} stopOpacity="0.95" />
          <stop offset="0.4" stopColor={colour} stopOpacity="0.62" />
          <stop offset="0.62" stopColor={colour} stopOpacity="0.2" />
          <stop offset="1" stopColor={colour} stopOpacity="0" />
        </radialGradient>
      </g>
    ))}
  </defs>
);

// drawn once and used everywhere a player's orb appears on the board, at whatever size
const Orb = ({ prefix, tone, radius, x = 0, y = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={radius * GLOW} fill={`url(#${prefix}-halo-${tone})`} />
    <circle r={radius} fill={`url(#${prefix}-orb-${tone})`} stroke={lighten(PALETTE[tone], 0.55)} strokeOpacity={0.7} strokeWidth={radius * 0.07} />
    <ellipse cx={-radius * 0.34} cy={-radius * 0.4} rx={radius * 0.32} ry={radius * 0.2} fill="#fff" opacity={0.7} />
  </g>
);

export default Orb;
