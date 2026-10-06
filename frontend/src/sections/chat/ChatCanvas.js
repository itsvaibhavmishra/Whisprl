import { Box } from "@mui/material";

import chatDoodles from "@/assets/backgrounds/chatDoodles.svg";

const DOODLE_COLOR = { light: "#DCE2E9", dark: "#323E4C" };

const ChatCanvas = ({ children, sx }) => (
  <Box
    sx={{
      position: "relative",
      isolation: "isolate",
      bgcolor: "background.paper",
      "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        bgcolor: (theme) => DOODLE_COLOR[theme.palette.mode],
        maskImage: `url(${chatDoodles})`,
        WebkitMaskImage: `url(${chatDoodles})`,
        maskSize: "420px",
        WebkitMaskSize: "420px",
      },
      ...sx,
    }}
  >
    {children}
  </Box>
);

export default ChatCanvas;
