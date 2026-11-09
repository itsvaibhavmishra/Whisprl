import { useEffect, useRef } from "react";
import { Box } from "@mui/material";

import Mascot from "@/assets/icons/logo/Whisprl.webp";

const LIGHT_UP = 0.5;
const FADE = 0.12;

// the cyan aura reaches past the artwork's own circle, so it shows as a glow around it
const AURA = {
  position: "absolute",
  left: "-16%",
  right: "-16%",
  top: "-2%",
  aspectRatio: "1",
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(76, 201, 240, 0.9) 30%, rgba(76, 201, 240, 0.35) 48%, rgba(76, 201, 240, 0) 66%)",
  opacity: "calc(0.12 + var(--level) * 0.88)",
  transform: "scale(calc(0.9 + var(--level) * 0.18))",
};

// measured from the artwork: the microphone's light is a bar 27 by 6 of its 600 by 648 pixels, tilted 10 degrees
const MIC_LIGHT = {
  position: "absolute",
  left: "61.67%",
  top: "59.18%",
  width: "4.67%",
  height: "0.93%",
  borderRadius: "99px",
  transform: "rotate(10deg)",
  bgcolor: "#c9f8ff",
  mixBlendMode: "screen",
  opacity: "calc(var(--level) * 1.2)",
  boxShadow: "0 0 calc(2px + var(--level) * 6px) calc(var(--level) * 1px) rgba(127, 227, 255, 0.9)",
};

// breathes and floats while it waits, and its aura and microphone glow with its voice
const TourMascot = ({ size, isGreeting, readLevel }) => {
  const figure = useRef(null);

  // written straight to the figure every frame, so the card around it never redraws for it
  useEffect(() => {
    let level = 0;
    let frame;
    const follow = () => {
      const loudness = readLevel();
      level += (loudness - level) * (loudness > level ? LIGHT_UP : FADE);
      figure.current?.style.setProperty("--level", level.toFixed(3));
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [readLevel]);

  return (
    <Box
      ref={figure}
      sx={{
        "--level": 0,
        position: "relative",
        width: size,
        flexShrink: 0,
        animation: isGreeting
          ? "tourPop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both, tourFloat 6s ease-in-out 600ms infinite"
          : "tourFloat 6s ease-in-out infinite",
        "@keyframes tourPop": { from: { opacity: 0, transform: "scale(0.6) translateY(16px)" } },
        "@keyframes tourFloat": { "50%": { translate: "0 -3px" } },
        "@keyframes tourBreathe": { "50%": { transform: "scale(1.015)" } },
        "@media (prefers-reduced-motion: reduce)": { animation: "none", "& img": { animation: "none" }, "& [data-aura]": { transform: "none" } },
      }}
    >
      <Box data-aura sx={AURA} />
      <Box
        component="img"
        src={Mascot}
        alt=""
        sx={{
          position: "relative",
          display: "block",
          width: "100%",
          height: "auto",
          animation: "tourBreathe 4s ease-in-out infinite",
          transformOrigin: "50% 85%",
        }}
      />
      <Box sx={MIC_LIGHT} />
    </Box>
  );
};

export default TourMascot;
