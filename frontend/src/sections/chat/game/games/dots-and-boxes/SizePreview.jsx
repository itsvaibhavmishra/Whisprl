import { Box } from "@mui/material";

const SPAN = 28;

// a board of n boxes is drawn as n dots a side in the same square, so a bigger board reads as denser
const SizePreview = ({ value, colour }) => {
  const dot = value > 4 ? 4 : 5;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${value}, ${dot}px)`,
        gridAutoRows: `${dot}px`,
        justifyContent: "space-between",
        alignContent: "space-between",
        width: SPAN,
        height: SPAN,
      }}
    >
      {Array.from({ length: value * value }, (_, index) => (
        <Box key={index} sx={{ width: dot, height: dot, borderRadius: "50%", bgcolor: colour }} />
      ))}
    </Box>
  );
};

export default SizePreview;
