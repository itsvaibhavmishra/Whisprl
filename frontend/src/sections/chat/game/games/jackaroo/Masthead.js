import { Box } from "@mui/material";
import { m, useReducedMotion } from "framer-motion";

import GameTitle from "@/sections/chat/game/GameTitle";
import art from "@/sections/chat/game/games/jackaroo/art";
import layout from "@/sections/chat/game/games/jackaroo/masthead.json";

// a marble sprite reaches a little past the marble's edge, so it is drawn that much larger round the same centre
const SPRITE = 1.12;
const ACROSS = layout.stage.width / layout.stage.height;

// the spring overshoots, which on opacity reads as a blink, so only the movement springs and the fade eases
const settle = (delay) => ({ default: { type: "spring", stiffness: 260, damping: 24, delay }, opacity: { duration: 0.3, delay, ease: "easeOut" } });

// placed in the scene's own coordinates, as shares of the stage, so each piece lands where the design put it at any width
const placed = ({ left, top, width }) => ({ position: "absolute", left: `${left}%`, top: `${top}%`, width: `${width}%` });

const spriteOf = ({ left, top, width }) => {
  const spill = (width * (SPRITE - 1)) / 2;
  return placed({ left: left - spill, top: top - spill * ACROSS, width: width * SPRITE });
};

// the sign over the board, as the start screen design has it, with the board laid out for a game about to begin
const Masthead = ({ title, name, isReady }) => {
  const isStill = useReducedMotion();
  const enter = (from, delay) => ({
    initial: isStill ? false : from,
    animate: isReady ? { y: 0, scale: 1, opacity: 1 } : from,
    transition: isStill ? { duration: 0 } : settle(delay),
  });

  return (
    <Box sx={{ position: "relative", width: "100%", aspectRatio: `${layout.stage.width} / ${layout.stage.height}`, flexShrink: 0 }}>
      <Box
        component={m.img}
        src={art.startBoard}
        alt=""
        aria-hidden
        {...enter({ y: 28, opacity: 0 }, 0.15)}
        sx={{ ...placed(layout.board), display: "block", filter: "drop-shadow(0 18px 22px rgba(20, 8, 2, 0.55))" }}
      />
      <Box sx={placed(layout.title)}>
        <GameTitle title={title} name={name} isReady={isReady} width="100%" />
      </Box>
      {layout.marbles.map((marble, index) => (
        <Box
          key={index}
          component={m.img}
          src={art.marble(marble.tone)}
          alt=""
          aria-hidden
          {...enter({ scale: 0, opacity: 0 }, 0.6 + index * 0.08)}
          sx={{ ...spriteOf(marble), display: "block", filter: "drop-shadow(1px 4px 3px rgba(30, 12, 4, 0.5))" }}
        />
      ))}
    </Box>
  );
};

export default Masthead;
