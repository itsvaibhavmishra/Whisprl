import { Box } from "@mui/material";
import { lighten } from "@mui/material/styles";

import ringHole from "@/assets/play/ring-hole.webp";
import ringShade from "@/assets/play/ring-shade.webp";

const maskOf = (image) => ({ maskImage: `url(${image})`, maskSize: "100% 100%", WebkitMaskImage: `url(${image})`, WebkitMaskSize: "100% 100%" });

// lit from the top left: a saturated inside and a lighter rim, each running light to dark across the same diagonal
const RingFrame = ({ from, to, size, children }) => (
  <Box sx={{ position: "relative", width: size, aspectRatio: "1", flexShrink: 0 }}>
    <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${from}, ${to})`, ...maskOf(ringHole) }} />
    <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${lighten(from, 0.4)}, ${lighten(to, 0.25)})`, ...maskOf(ringShade) }} />
    <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{children}</Box>
  </Box>
);

export default RingFrame;
