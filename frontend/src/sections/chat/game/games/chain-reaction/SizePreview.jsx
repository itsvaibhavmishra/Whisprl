import { Box } from "@mui/material";

import { SIZES } from "@/sections/chat/game/games/chain-reaction/sizes";

const TALLEST = 36;

// each board drawn as its own grid of dots at one height, so a bigger board reads as denser rather than bigger
const SizePreview = ({ value, colour }) => {
  const { width, height } = SIZES[value];
  const dot = Math.min(4, TALLEST / (height * 1.5));
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${width}, ${dot}px)`,
        gridAutoRows: `${dot}px`,
        justifyContent: "space-between",
        alignContent: "space-between",
        width: (TALLEST * width) / height,
        height: TALLEST,
      }}
    >
      {Array.from({ length: width * height }, (_, index) => (
        <Box key={index} sx={{ width: dot, height: dot, borderRadius: "50%", bgcolor: colour }} />
      ))}
    </Box>
  );
};

export default SizePreview;
