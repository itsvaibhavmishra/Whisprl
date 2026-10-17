import { useRef, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { m, useReducedMotion } from "framer-motion";

import { GAMES } from "@/sections/chat/game/catalog";
import GameRoom from "@/sections/chat/game/GameRoom";

export const CHAT_MIN_WIDTH = 380;
const KEY_STEP = 24;
const SLIDE = { duration: 0.34, ease: [0.32, 0.72, 0, 1] };
const STILL = { duration: 0 };

const storageKeyOf = (gameId) => `game-width:${gameId}`;

const clampedTo = ({ min, max }, width) => Math.min(max, Math.max(min, Math.round(width)));

const savedWidthOf = (gameId) => {
  const { width } = GAMES[gameId];
  try {
    const saved = Number(localStorage.getItem(storageKeyOf(gameId)));
    return saved ? clampedTo(width, saved) : width.preferred;
  } catch {
    return width.preferred;
  }
};

const saveWidth = (gameId, width) => {
  try {
    localStorage.setItem(storageKeyOf(gameId), String(width));
  } catch {
    // a browser that keeps nothing still resizes, it just forgets on reload
  }
};

const ResizeHandle = ({ width, bounds, onResize }) => {
  const theme = useTheme();
  const drag = useRef(null);
  // the panel sits at the end of the row, so pulling its edge towards the start makes it wider
  const towardsStart = theme.direction === "rtl" ? -1 : 1;

  // a saved width can be more than this window fits, so steps start from the width on screen
  const shownWidthOf = (event) => Math.round(event.currentTarget.parentElement.getBoundingClientRect().width);
  const keyWidthOf = (key, shown) => ({ ArrowLeft: shown + KEY_STEP * towardsStart, ArrowRight: shown - KEY_STEP * towardsStart, Home: bounds.min, End: bounds.max })[key];

  return (
    <Box
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the game"
      aria-valuemin={bounds.min}
      aria-valuemax={bounds.max}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { startX: event.clientX, startWidth: shownWidthOf(event) };
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        onResize(drag.current.startWidth + (drag.current.startX - event.clientX) * towardsStart, false);
      }}
      onPointerUp={() => {
        drag.current = null;
        onResize(width, true);
      }}
      onKeyDown={(event) => {
        const next = keyWidthOf(event.key, shownWidthOf(event));
        if (next === undefined) return;
        event.preventDefault();
        onResize(next, true);
      }}
      onDoubleClick={() => onResize(bounds.preferred, true)}
      sx={{
        position: "absolute",
        zIndex: 2,
        top: 0,
        bottom: 0,
        left: 0,
        width: 8,
        cursor: "col-resize",
        touchAction: "none",
        outline: "none",
        "&::after": { content: '""', position: "absolute", top: 0, bottom: 0, left: 0, width: 2, bgcolor: "transparent", transition: "background-color 120ms ease" },
        "&:hover::after, &:focus-visible::after, &:active::after": { bgcolor: "primary.main" },
      }}
    />
  );
};

const GamePanel = ({ conversation, session, onPress }) => {
  const gameId = session.game;
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up("lg"));
  const isStill = useReducedMotion();
  const [width, setWidth] = useState(() => savedWidthOf(gameId));
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef(null);
  const bounds = GAMES[gameId].width;

  // a narrow window holds less than the game allows, and a width past what fits would make the handle do nothing
  const roomLeft = () => (panelRef.current?.parentElement?.clientWidth ?? Infinity) - CHAT_MIN_WIDTH;

  const resize = (next, isFinal) => {
    const fitted = clampedTo({ min: bounds.min, max: Math.max(bounds.min, Math.min(bounds.max, roomLeft())) }, next);
    setWidth(fitted);
    setIsResizing(!isFinal);
    if (isFinal) saveWidth(gameId, fitted);
  };

  if (!isWide) {
    return (
      <Box
        key="narrow"
        component={m.div}
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -24 }}
        transition={isStill ? STILL : SLIDE}
        onPointerDown={onPress}
        sx={{ flex: 1, minHeight: 0, display: "flex" }}
      >
        <GameRoom conversation={conversation} session={session} />
      </Box>
    );
  }

  return (
    // keyed apart from the narrow layout, so crossing the breakpoint never carries the slide's inline width over
    <Box
      key="wide"
      component={m.div}
      ref={panelRef}
      initial={{ width: 0 }}
      animate={{ width }}
      exit={{ width: 0 }}
      transition={isResizing || isStill ? STILL : SLIDE}
      sx={{ position: "relative", flexShrink: 0, maxWidth: `calc(100% - ${CHAT_MIN_WIDTH}px)`, display: "flex", overflow: "hidden", borderLeft: 1, borderColor: "divider" }}
    >
      <ResizeHandle width={width} bounds={bounds} onResize={resize} />
      {/* clipped rather than squeezed while the panel slides open */}
      <Box sx={{ flex: 1, minWidth: bounds.min, overflow: "hidden", display: "flex" }}>
        <GameRoom conversation={conversation} session={session} />
      </Box>
    </Box>
  );
};

export default GamePanel;
