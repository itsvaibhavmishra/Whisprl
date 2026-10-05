import { Box } from "@mui/material";

const HEAVIEST = 800;
const LIGHTEST = 200;
const STEP = 100;

// Each letter a weight lighter than the last, so the name trails off the way a whisper does.
const Wordmark = ({ name, fontSize = { xs: "4.5rem", sm: "6.5rem", md: "8.5rem", lg: "9.5rem" } }) => (
  <Box
    component="span"
    sx={{
      display: "block",
      fontSize,
      lineHeight: 0.92,
      letterSpacing: "-0.045em",
    }}
  >
    {[...name].map((letter, position) => (
      <Box
        component="span"
        key={position}
        sx={{ fontWeight: Math.max(LIGHTEST, HEAVIEST - position * STEP) }}
      >
        {letter}
      </Box>
    ))}
  </Box>
);

export default Wordmark;
