import { memo } from "react";
import { Box } from "@mui/material";

import art from "@/sections/chat/game/games/jackaroo/art";

// the user's card back, in its own taller shape
export const BACK_RATIO = 589 / 958;

const CardBack = () => <Box component="img" alt="" src={art.cardBack} sx={{ display: "block", width: "100%", aspectRatio: String(BACK_RATIO) }} />;

export default memo(CardBack);
