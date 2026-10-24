import { useEffect, useRef, useState } from "react";
import { Box, IconButton, Tooltip, useMediaQuery } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import { MAX_EMOJI_SCALE } from "@/utils/emoji";
import { playDeflateTone, startRisingTone } from "@/utils/sounds";

const HOLD_MS = 220;
const GROW_MS = 900;
// held this long at full size, the emoji is let go instead of sent, which is how a hold is called off
const DEFLATE_AFTER_MS = 1000;
const DEFLATE_MS = 160;
const MAX_SHAKE_DEG = 8;

const shake = keyframes`
  25% { rotate: calc(var(--shake) * -1); }
  75% { rotate: var(--shake); }
`;

// down into the button it grew out of
const shrinkBack = keyframes`
  to { transform: translateY(calc(100% + 8px)) scale(0.9); opacity: 0; }
`;

// grown from the button's right edge, so at full size it stays on the screen
const OVER_BUTTON = {
  position: "absolute",
  right: 0,
  bottom: "100%",
  mb: 1,
  fontSize: 28,
  lineHeight: 1,
  pointerEvents: "none",
  transformOrigin: "bottom right",
};

const QuickEmojiButton = ({ emoji, buttonSx, onSend }) => {
  const [scale, setScale] = useState(1);
  const [deflatingFrom, setDeflatingFrom] = useState(null);
  const [isPressed, setIsPressed] = useState(false);
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const holdTimer = useRef(null);
  const deflateTimer = useRef(null);
  const frame = useRef(null);
  const reached = useRef(1);
  const wasHeld = useRef(false);
  const stopTone = useRef(null);

  const silence = () => {
    stopTone.current?.();
    stopTone.current = null;
  };

  const stop = () => {
    clearTimeout(holdTimer.current);
    clearTimeout(deflateTimer.current);
    cancelAnimationFrame(frame.current);
    silence();
    reached.current = 1;
    setScale(1);
    setIsPressed(false);
  };

  useEffect(
    () => () => {
      clearTimeout(holdTimer.current);
      clearTimeout(deflateTimer.current);
      cancelAnimationFrame(frame.current);
      stopTone.current?.();
    },
    []
  );

  // the click that follows letting go must not send it after all
  const deflate = () => {
    setDeflatingFrom(reached.current);
    wasHeld.current = true;
    stop();
    playDeflateTone();
  };

  const grow = (startedAt) => {
    const part = Math.min((performance.now() - startedAt) / GROW_MS, 1);
    reached.current = 1 + part * (MAX_EMOJI_SCALE - 1);
    setScale(reached.current);
    if (part < 1) frame.current = requestAnimationFrame(() => grow(startedAt));
    else deflateTimer.current = setTimeout(deflate, DEFLATE_AFTER_MS);
  };

  const press = () => {
    wasHeld.current = false;
    setIsPressed(true);
    holdTimer.current = setTimeout(() => {
      stopTone.current = startRisingTone(GROW_MS);
      grow(performance.now());
    }, HOLD_MS);
  };

  // letting go after a hold sends the size it grew to, and the click that follows must not send a second
  const release = () => {
    if (reached.current > 1) {
      wasHeld.current = true;
      onSend(Math.round(reached.current * 100) / 100);
    }
    stop();
  };

  const tap = () => {
    if (wasHeld.current) wasHeld.current = false;
    else onSend(1);
  };

  const label = `Send ${emoji}, hold to send it bigger`;

  return (
    <Box sx={{ position: "relative" }}>
      {scale > 1 && (
        <Box
          aria-hidden
          sx={{
            ...OVER_BUTTON,
            transform: `scale(${scale})`,
            // shakes harder the bigger it grows, as a balloon does near bursting
            "--shake": `${((scale - 1) / (MAX_EMOJI_SCALE - 1)) * MAX_SHAKE_DEG}deg`,
            animation: `${shake} 140ms ease-in-out infinite`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        >
          {emoji}
        </Box>
      )}
      {deflatingFrom && (
        <Box
          aria-hidden
          onAnimationEnd={() => setDeflatingFrom(null)}
          sx={{ ...OVER_BUTTON, transform: `scale(${deflatingFrom})`, animation: `${shrinkBack} ${DEFLATE_MS}ms ease-in forwards` }}
        >
          {emoji}
        </Box>
      )}
      {/* a mouse's hover only, since on a touch screen or mid-press it would sit over the growing emoji */}
      <Tooltip title={canHover && !isPressed ? label : ""}>
        <IconButton
          aria-label={label}
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={stop}
          onPointerCancel={stop}
          onClick={tap}
          sx={{ fontSize: 24, ...buttonSx, touchAction: "none" }}
        >
          {emoji}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default QuickEmojiButton;
