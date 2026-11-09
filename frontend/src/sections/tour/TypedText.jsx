import { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useReducedMotion } from "motion/react";

import { SPOKEN_ONLY } from "@/utils/spokenOnly";

const LETTERS_A_SECOND = 32;

// typed at the pace of the voice when there is one; a tap or reduced motion shows it whole, and a screen reader always reads it whole
const TypedText = ({ text, duration, isFinished }) => {
  const isReduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const isWhole = isReduced || isFinished;

  useEffect(() => {
    if (isWhole) return undefined;
    const pace = duration ? text.length / duration : LETTERS_A_SECOND;
    // a voice's length can arrive after typing has begun, so the new pace carries on from where it got to
    const startedAt = performance.now() - (shownRef.current / pace) * 1000;
    let frame;
    const type = (now) => {
      const count = Math.min(text.length, Math.floor(((now - startedAt) / 1000) * pace));
      shownRef.current = count;
      setShown(count);
      if (count < text.length) frame = requestAnimationFrame(type);
    };
    frame = requestAnimationFrame(type);
    return () => cancelAnimationFrame(frame);
  }, [text, duration, isWhole]);

  return (
    <Typography component="div" sx={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, minHeight: "3em" }}>
      <Box component="span" aria-hidden>
        {isWhole ? text : text.slice(0, shown)}
      </Box>
      <Box component="span" sx={SPOKEN_ONLY}>
        {text}
      </Box>
    </Typography>
  );
};

export default TypedText;
