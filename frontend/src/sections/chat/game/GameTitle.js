import { Box } from "@mui/material";
import { m, useReducedMotion } from "framer-motion";

const DROP = { type: "spring", stiffness: 420, damping: 26 };
const BETWEEN_WORDS = 0.11;
const BEFORE_FIRST_WORD = 0.3;

// each word falls on its own, which is why the artwork was cut into words rather than used whole
const GameTitle = ({ title, name, isStatic = false, isReady = true, width }) => {
  const isStill = useReducedMotion() || isStatic;

  return (
    <Box
      role="img"
      aria-label={name}
      sx={{ position: "relative", width: width ?? "88%", maxWidth: width ?? 440, aspectRatio: String(title.ratio), flexShrink: 0 }}
    >
      {title.words.map(({ word, src, left, top, width: wide, height }, index) => (
        <Box
          key={word}
          component={m.img}
          src={src}
          alt=""
          aria-hidden
          initial={isStill ? false : { y: -44, opacity: 0 }}
          animate={isReady ? { y: 0, opacity: 1 } : { y: -44, opacity: 0 }}
          transition={isStill ? { duration: 0 } : { ...DROP, delay: BEFORE_FIRST_WORD + index * BETWEEN_WORDS }}
          sx={{
            position: "absolute",
            left: `${left * 100}%`,
            top: `${top * 100}%`,
            width: `${wide * 100}%`,
            height: `${height * 100}%`,
            filter: "drop-shadow(0 4px 7px rgba(60, 40, 90, 0.4))",
          }}
        />
      ))}
    </Box>
  );
};

export default GameTitle;
