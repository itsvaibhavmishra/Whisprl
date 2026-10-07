import { Box, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { m } from "framer-motion";

import chatDoodles from "@/assets/backgrounds/chatDoodles.svg";
import { useWallpaper } from "@/sections/chat/wallpaper/wallpapers";

const SPOTS = [
  [18, 20],
  [50, 8],
  [84, 22],
  [94, 54],
  [80, 86],
  [48, 94],
  [14, 80],
  [6, 46],
];
const BLOB_SCALE = 1.3;
const DRIFT = { duration: 0.9, ease: [0.33, 1, 0.68, 1] };

const Blobs = ({ colors, step, sx }) => (
  <Box aria-hidden sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", ...sx }}>
    {colors.map((color, index) => {
      // every other spot, so the blobs spread evenly, and each step moves them all one spot round
      const [left, top] = SPOTS[(index * 2 + step) % SPOTS.length];
      return (
        <m.div
          key={color}
          initial={false}
          animate={{ x: `${(left - 50) / BLOB_SCALE}%`, y: `${(top - 50) / BLOB_SCALE}%` }}
          transition={DRIFT}
          style={{
            position: "absolute",
            left: `${50 - BLOB_SCALE * 50}%`,
            top: `${50 - BLOB_SCALE * 50}%`,
            width: `${BLOB_SCALE * 100}%`,
            height: `${BLOB_SCALE * 100}%`,
            background: `radial-gradient(closest-side, ${color}, ${alpha(color, 0.5)} 45%, ${alpha(color, 0)})`,
          }}
        />
      );
    })}
  </Box>
);

const maskOf = (size) => ({
  maskImage: `url(${chatDoodles})`,
  WebkitMaskImage: `url(${chatDoodles})`,
  maskSize: `${size}px`,
  WebkitMaskSize: `${size}px`,
});

// at night a full wash would outshine the bubbles, so the colours only glow and light up the doodles
export const WallpaperLayers = ({ colors, doodles, doodleSize, step = 0, isSwatch = false }) => {
  const isDark = useTheme().palette.mode === "dark";
  const doodleMask = maskOf(doodleSize);
  // a swatch glows stronger than the canvas, or every dark tile would read as black
  const nightGlow = isSwatch ? 0.4 : 0.1;
  return (
    <>
      {colors && <Blobs colors={colors} step={step} sx={{ zIndex: -3, opacity: isDark ? nightGlow : 0.4 }} />}
      {doodles && <Box aria-hidden sx={{ position: "absolute", inset: 0, zIndex: -2, pointerEvents: "none", bgcolor: "chat.doodle", ...doodleMask }} />}
      {doodles && colors && isDark && <Blobs colors={colors} step={step} sx={{ zIndex: -1, opacity: 0.2, ...doodleMask }} />}
    </>
  );
};

const ChatCanvas = ({ children, sx, conversationId, step }) => {
  const { colors, doodles } = useWallpaper(conversationId);
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  return (
    <Box sx={{ position: "relative", isolation: "isolate", overflow: "hidden", bgcolor: "chat.canvas", ...sx }}>
      <WallpaperLayers colors={colors} doodles={doodles} step={step} doodleSize={isPhone ? 400 : 560} />
      {children}
    </Box>
  );
};

export default ChatCanvas;
