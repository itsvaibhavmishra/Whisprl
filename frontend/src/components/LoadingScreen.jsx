import { createContext, useContext, useLayoutEffect, useRef } from "react";
import { Box, Stack } from "@mui/material";
import { keyframes } from "@mui/material/styles";

// a layout's page area fills what its navigation leaves, so a loader inside it centres there rather than on the whole screen
export const PageArea = createContext(null);

const sizeOf = ({ fromChat, isAuthRoute, pageArea }) => {
  if (fromChat) return { height: "100%" };
  if (isAuthRoute) return { height: "50vh" };
  if (pageArea) return { flex: 1, pt: pageArea.isUnderStatusBar ? "env(safe-area-inset-top)" : 0 };
  return { minHeight: "100dvh" };
};

const FILL = "1.6s ease-in-out infinite";

const fillIn = (pop) => keyframes`
  0% { fill-opacity: 0.18; transform: translateY(0) scale(1); }
  15% { fill-opacity: 1; transform: ${pop}; }
  30% { transform: translateY(0) scale(1); }
  70% { fill-opacity: 1; }
  100% { fill-opacity: 0.18; }
`;

const press = fillIn("translateY(-4px) scale(1.08)");
// the pad only swells where the toes hop, so the paw keeps its shape
const swell = fillIn("translateY(0) scale(1.03)");

const TOES = [
  { cx: -8.2, cy: -2.6, rx: 2.6, ry: 3.4, angle: -24 },
  { cx: -3.1, cy: -8, rx: 2.8, ry: 3.7, angle: -8 },
  { cx: 3.1, cy: -8, rx: 2.8, ry: 3.7, angle: 8 },
  { cx: 8.2, cy: -2.6, rx: 2.6, ry: 3.4, angle: 24 },
];
const PAD = "M0 -1.2 C4.4 -1.2 8.6 3.4 7.4 7 C6.4 9.8 2.8 9.2 0 9.2 C-2.8 9.2 -6.4 9.8 -7.4 7 C-8.6 3.4 -4.4 -1.2 0 -1.2 Z";

const beanSx = (motion, delayMs) => (theme) => ({
  fill: theme.palette.primary.main,
  stroke: theme.palette.primary.main,
  strokeWidth: 0.6,
  transformBox: "fill-box",
  transformOrigin: "center",
  animation: `${motion} ${FILL}`,
  animationDelay: `${delayMs}ms`,
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
});

const LoadingScreen = ({ fromChat }) => {
  const isAuthRoute = window.location.pathname.includes("/auth");
  const pageArea = useContext(PageArea);
  const pawRef = useRef(null);

  // every loader runs on the page's clock, so one that takes over from another carries on instead of starting over
  useLayoutEffect(() => {
    pawRef.current.getAnimations({ subtree: true }).forEach((animation) => {
      animation.startTime = 0;
    });
  }, []);

  return (
    <Stack
      role="status"
      aria-label="Loading"
      sx={[{ width: "100%", justifyContent: "center", alignItems: "center" }, sizeOf({ fromChat, isAuthRoute, pageArea })]}
    >
      <Box component="svg" ref={pawRef} viewBox="-15 -15 30 30" aria-hidden sx={{ width: 80, height: 80, overflow: "visible" }}>
        {/* each toe turns inside its own group, so the press animation never undoes its tilt */}
        {TOES.map(({ cx, cy, rx, ry, angle }, index) => (
          <g key={angle} transform={`rotate(${angle} ${cx} ${cy})`}>
            <Box component="ellipse" cx={cx} cy={cy} rx={rx} ry={ry} sx={beanSx(press, index * 120)} />
          </g>
        ))}
        <Box component="path" d={PAD} sx={beanSx(swell, 500)} />
      </Box>
    </Stack>
  );
};

export default LoadingScreen;
