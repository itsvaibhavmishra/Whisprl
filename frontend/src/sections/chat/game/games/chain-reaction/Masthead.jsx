import { useId } from "react";
import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { m, useReducedMotion } from "framer-motion";

import art from "@/sections/chat/game/games/chain-reaction/art";
import EnergyOrb, { EnergyDefs } from "@/sections/chat/game/games/chain-reaction/EnergyOrb";
import layout from "@/sections/chat/game/games/chain-reaction/masthead.json";
import { OrbDefs } from "@/sections/chat/game/games/chain-reaction/Orb";
import SkyZaps from "@/sections/chat/game/games/chain-reaction/SkyZaps";
import Wordmark from "@/sections/chat/game/games/chain-reaction/Wordmark";

const RISE = 40;
const riseAfter = (delay) => ({ default: { type: "spring", stiffness: 240, damping: 20, delay }, opacity: { duration: 0.3, delay, ease: "easeOut" } });

// the cat bats the orb in front of it now and then, rather than the orb bouncing on its own
const hop = keyframes`
  0%, 70%, 100% { transform: translateY(0); }
  78% { transform: translateY(-14px); }
  86% { transform: translateY(0); }
  91% { transform: translateY(-5px); }
`;

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const Placed = ({ piece, src }) => <image href={src} width={piece.width} height={piece.height} transform={`matrix(${piece.matrix.join(" ")})`} />;

const Rising = ({ isStill, isReady, delay, children }) => (
  <m.g
    initial={isStill ? false : { y: RISE, opacity: 0 }}
    animate={isReady ? { y: 0, opacity: 1 } : { y: RISE, opacity: 0 }}
    transition={isStill ? { duration: 0 } : riseAfter(delay)}
  >
    {children}
  </m.g>
);

// the top band of the scene, drawn in the scene's own pixels so every piece lands where the design put it
const Masthead = ({ isReady }) => {
  const prefix = `mh${useId().replace(/:/g, "")}`;
  const isStill = useReducedMotion();
  const { stage, wordmark } = layout;

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${stage.width} ${stage.height}`}
      aria-hidden
      sx={{ display: "block", width: "100%", aspectRatio: `${stage.width} / ${stage.height}`, overflow: "visible", flexShrink: 0 }}
    >
      <OrbDefs prefix={prefix} />
      <EnergyDefs prefix={prefix} />
      {!isStill && <SkyZaps />}
      <Wordmark x={wordmark.x} y={wordmark.y} width={wordmark.width} isReady={isReady} />
      <Rising isStill={isStill} isReady={isReady} delay={0.55}>
        <Placed piece={layout.cat} src={art.cat} />
      </Rising>
      <Rising isStill={isStill} isReady={isReady} delay={0.7}>
        <Box component="g" sx={isStill ? undefined : { animation: `${bob} 3.4s ease-in-out 1.5s infinite` }}>
          <Placed piece={layout.robot} src={art.robot} />
        </Box>
      </Rising>
      {layout.platform.map((orb, index) => (
        <g key={`${orb.x}-${orb.y}`}>
          {/* each orb lights the floor under it, which is what sits it on the platform rather than in front of it */}
          <ellipse
            cx={orb.x}
            cy={orb.y + orb.radius * 0.92}
            rx={orb.radius * 1.5}
            ry={orb.radius * 0.38}
            fill={`url(#${prefix}-halo-${orb.tone})`}
            style={{ mixBlendMode: "screen" }}
          />
          <Box component="g" sx={orb.hops && !isStill ? { animation: `${hop} 4.2s ease-out 2s infinite` } : undefined}>
            <EnergyOrb prefix={prefix} tone={orb.tone} radius={orb.radius} x={orb.x} y={orb.y} seed={index + 7} isStill={isStill} />
          </Box>
        </g>
      ))}
    </Box>
  );
};

export default Masthead;
