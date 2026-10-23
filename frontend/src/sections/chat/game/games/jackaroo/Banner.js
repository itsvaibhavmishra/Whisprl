import { Box, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import CardFace from "@/sections/chat/game/games/jackaroo/CardFace";
import { bannerOf } from "@/sections/chat/game/games/jackaroo/cards";
import FONTS from "@/sections/chat/game/games/jackaroo/fonts";

const dropIn = keyframes`from { transform: translateY(-12px); opacity: 0; } to { transform: none; opacity: 1; }`;

// a picked card says what it does in a dark banner over the other player, the way the reference game shows it
const Banner = ({ card, tones }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1.25}
    aria-live="polite"
    sx={{
      position: "absolute",
      zIndex: 5,
      top: 8,
      left: 12,
      right: 12,
      mx: "auto",
      maxWidth: 420,
      px: 1.25,
      py: 1,
      borderRadius: 3,
      bgcolor: "rgba(20, 12, 8, 0.92)",
      boxShadow: "0 6px 18px rgba(0, 0, 0, 0.45)",
      pointerEvents: "none",
      animation: `${dropIn} 180ms ease-out`,
      "@media (prefers-reduced-motion: reduce)": { animation: "none" },
    }}
  >
    <Box sx={{ width: 34, flexShrink: 0 }}>
      <CardFace card={card} tones={tones} />
    </Box>
    <Typography sx={{ color: "#f6ebdd", fontFamily: FONTS.body, fontWeight: 600, fontSize: 14.5, lineHeight: 1.3 }}>{bannerOf(card)}</Typography>
  </Stack>
);

export default Banner;
