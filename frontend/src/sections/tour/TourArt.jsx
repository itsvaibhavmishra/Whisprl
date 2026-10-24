import { Box } from "@mui/material";
import { LockKey } from "phosphor-react";

import chainReaction from "@/assets/tour/chain-reaction.webp";
import dotsAndBoxes from "@/assets/tour/dots-and-boxes.webp";
import ticTacToe from "@/assets/tour/tic-tac-toe.webp";
import MascotHalo from "@/components/MascotHalo";
import HeroConversation from "@/sections/welcome/HeroConversation";

// real games caught mid-play rather than their artwork, so the tour shows what playing looks like
const FAN = [
  { shot: ticTacToe, turn: -9, shift: "-62%", depth: 0 },
  { shot: dotsAndBoxes, turn: 9, shift: "62%", depth: 0 },
  { shot: chainReaction, turn: 0, shift: "0%", depth: 1 },
];

export const ChatArt = () => (
  <Box sx={{ width: "100%", maxWidth: 340, textAlign: "left" }}>
    <HeroConversation />
  </Box>
);

export const LockArt = () => (
  <Box sx={{ position: "relative", transform: "scale(1.2)" }}>
    <MascotHalo />
    <Box
      sx={{
        position: "absolute",
        right: 12,
        bottom: 14,
        width: 56,
        height: 56,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        bgcolor: "primary.main",
        color: "primary.contrastText",
        boxShadow: (theme) => `0 0 0 6px ${theme.palette.background.default}`,
      }}
    >
      <LockKey size={28} weight="fill" />
    </Box>
  </Box>
);

export const GamesArt = () => (
  <Box sx={{ position: "relative", width: 172, aspectRatio: "480 / 856" }}>
    {FAN.map(({ shot, turn, shift, depth }) => (
      <Box
        key={shot}
        component="img"
        src={shot}
        alt=""
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          borderRadius: 4,
          zIndex: depth,
          transform: `translateX(${shift}) rotate(${turn}deg) scale(${depth ? 1.08 : 0.94})`,
          boxShadow: "0 18px 40px rgba(0, 0, 0, 0.45)",
        }}
      />
    ))}
  </Box>
);
