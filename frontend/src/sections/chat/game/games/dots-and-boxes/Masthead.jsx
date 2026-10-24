import { Box } from "@mui/material";
import { m, useReducedMotion } from "motion/react";

import GameTitle from "@/sections/chat/game/GameTitle";
import art from "@/sections/chat/game/games/dots-and-boxes/art";
import layout from "@/sections/chat/game/games/dots-and-boxes/masthead.json";

// the spring overshoots, which on opacity reads as a blink, so only the rise springs and the fade eases
const PEEK = { default: { type: "spring", stiffness: 240, damping: 20, delay: 0.55 }, opacity: { duration: 0.3, delay: 0.55, ease: "easeOut" } };

// placed in the scene's own coordinates, as shares of the stage, so each piece lands on the art at any width
const placed = ({ left, top, width, matrix }) => ({
  position: "absolute",
  left: `${left}%`,
  top: `${top}%`,
  width: `${width}%`,
  transform: `matrix(${matrix.join(", ")}, 0, 0)`,
  transformOrigin: "0 0",
});

// the top band of the scene, with the cat on the desk's back edge and the pad lying just in front of it
const Masthead = ({ title, name, isReady }) => {
  const isStill = useReducedMotion();

  return (
    <Box sx={{ position: "relative", width: "100%", aspectRatio: `${layout.stage.width} / ${layout.stage.height}`, flexShrink: 0 }}>
      <Box
        component="img"
        src={art.notebook}
        alt=""
        aria-hidden
        sx={{ ...placed(layout.notebook), display: "block", filter: "drop-shadow(0 10px 22px rgba(60, 36, 14, 0.4))" }}
      />
      <Box sx={placed(layout.title)}>
        <GameTitle title={title} name={name} isReady={isReady} width="100%" />
      </Box>
      <Box sx={placed(layout.cat)}>
        <Box
          component={m.img}
          src={art.cat}
          alt=""
          aria-hidden
          initial={isStill ? false : { y: 30, opacity: 0 }}
          animate={isReady ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={isStill ? { duration: 0 } : PEEK}
          sx={{ width: "100%", display: "block", filter: "drop-shadow(0 5px 9px rgba(60, 36, 14, 0.32))" }}
        />
      </Box>
    </Box>
  );
};

export default Masthead;
