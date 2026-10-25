import { useState } from "react";
import { Box } from "@mui/material";
import { useReducedMotion } from "motion/react";

// Google's Noto animated emoji, scaled down to ship with the app; credited in the Readme
const artOf = (emoji) => `${import.meta.env.BASE_URL}reactions/${[...emoji].map((character) => character.codePointAt(0).toString(16)).join("_")}.webp`;

// the plain emoji holds the spot until its animation has loaded, so a thrown one never shows as a gap
const ReactionEmoji = ({ emoji, size }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const isStill = useReducedMotion();
  const isAnimated = isLoaded && !isStill;

  return (
    <Box component="span" role="img" aria-label={emoji} sx={{ display: "inline-grid", placeItems: "center", width: size, height: size, flexShrink: 0 }}>
      {!isStill && (
        <Box
          component="img"
          src={artOf(emoji)}
          alt=""
          draggable={false}
          onLoad={() => setIsLoaded(true)}
          sx={{ gridArea: "1 / 1", width: size, height: size, opacity: isAnimated ? 1 : 0 }}
        />
      )}
      {!isAnimated && (
        <Box component="span" aria-hidden sx={{ gridArea: "1 / 1", fontSize: size * 0.8, lineHeight: 1 }}>
          {emoji}
        </Box>
      )}
    </Box>
  );
};

export default ReactionEmoji;
