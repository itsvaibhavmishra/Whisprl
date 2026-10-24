import { Box } from "@mui/material";

// drawn rather than typed, because a font's suits come out too thin and too varied beside the design's heavy ones
const SHAPES = {
  S: "M50 4C38 22 8 38 8 62c0 15 12 25 25 25 6 0 11-2 14-6-2 9-6 15-12 19h30c-6-4-10-10-12-19 3 4 8 6 14 6 13 0 25-10 25-25C92 38 62 22 50 4z",
  H: "M50 92C34 76 6 58 6 34 6 18 18 8 31 8c9 0 15 5 19 12 4-7 10-12 19-12 13 0 25 10 25 26 0 24-28 42-44 58z",
  D: "M50 4c12 18 24 32 38 46C74 64 62 78 50 96 38 78 26 64 12 50 26 36 38 22 50 4z",
  C: "M50 6a18 18 0 0 0-14 29A18 18 0 1 0 47 66c-2 11-6 20-12 26h30c-6-6-10-15-12-26a18 18 0 1 0 11-31A18 18 0 0 0 50 6z",
};

const Suit = ({ suit, colour, sx }) => (
  <Box component="svg" viewBox="0 0 100 100" aria-hidden sx={{ display: "block", ...sx }}>
    <path d={SHAPES[suit]} fill={colour} />
  </Box>
);

export default Suit;
