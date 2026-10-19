import { Box } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";

import Mascot from "@/assets/icons/logo/Whisprl.webp";

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const MascotHalo = ({ size = 176 }) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      background: (theme) => `radial-gradient(circle at 50% 55%, ${alpha(theme.palette.primary.glow, 0.45)}, ${alpha(theme.palette.primary.glow, 0)} 68%)`,
    }}
  >
    <Box
      component="img"
      src={Mascot}
      alt=""
      sx={{ width: "85%", height: "auto", animation: `${float} 5s ease-in-out infinite`, "@media (prefers-reduced-motion: reduce)": { animation: "none" } }}
    />
  </Box>
);

export default MascotHalo;
