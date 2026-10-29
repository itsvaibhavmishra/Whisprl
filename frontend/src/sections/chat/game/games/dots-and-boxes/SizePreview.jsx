import { Box } from "@mui/material";

import SIZES from "@/sections/chat/game/games/dots-and-boxes/sizes";

const SPAN = 28;

// a board of n boxes is drawn as n dots a side in the same height, so a bigger board reads as denser and a tall one as narrower
const SizePreview = ({ value, colour }) => {
  const { width, height } = SIZES[value];
  const dot = height > 5 ? 3 : height > 4 ? 4 : 5;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${width}, ${dot}px)`,
        gridAutoRows: `${dot}px`,
        justifyContent: "space-between",
        alignContent: "space-between",
        width: (SPAN * width) / height,
        height: SPAN,
      }}
    >
      {Array.from({ length: width * height }, (_, index) => (
        <Box key={index} sx={{ width: dot, height: dot, borderRadius: "50%", bgcolor: colour }} />
      ))}
    </Box>
  );
};

export default SizePreview;
