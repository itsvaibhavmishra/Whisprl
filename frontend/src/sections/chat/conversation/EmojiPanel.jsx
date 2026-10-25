import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";

import EmojiPicker from "@/components/emoji-picker/EmojiPicker";
import useScreenBack from "@/hooks/useScreenBack";

// a computer has no keyboard height to match, so its panel opens at about a phone keyboard's
export const DESKTOP_PANEL_HEIGHT = 320;

// how far down the screen a panel pulled all the way up stops, so the chat's header and the field above it stay in view
const KEEP_ABOVE = 210;
// a pull this far below the panel's own height puts it away
const CLOSE_PULL = 0.4;
// a flick down the list faster than this, in pixels a millisecond, opens the panel all the way; a slow scroll leaves it
const FLING_SPEED = 1.2;
const FLING_SAMPLE_MS = 80;
// only a scroll this soon after a wheel or a finger's move counts, so jumping to a section never flings the panel open
const INPUT_GRACE_MS = 300;
// how far past the list's top a scroll up has to carry before the panel goes back to its own height
const PULL_BACK = 60;
// above a keyboard, room for the search and a few rows of what it finds
const SEARCHING_HEIGHT = 240;
// a release moving faster than this, in pixels a millisecond, goes the way it was flicked whatever distance it covered
const FLICK_SPEED = 0.35;
// only the last moments of a drag say how fast it was let go
const RELEASE_SAMPLE_MS = 100;

// the conversation above gives up its room as the panel grows, so how far it can go is read from where it sits now
const tallestOf = (panel, baseHeight) => {
  const { top, height } = panel.getBoundingClientRect();
  return Math.max(baseHeight, height + top - KEEP_ABOVE);
};

// a finger that stopped before lifting carries no speed, so the release goes by where the panel was left
const upwardSpeedAt = (points, releasedAt) => {
  const recent = points.filter((point) => releasedAt - point.time < RELEASE_SAMPLE_MS);
  if (recent.length < 2) return 0;
  const [first, last] = [recent[0], recent.at(-1)];
  return (first.y - last.y) / Math.max(last.time - first.time, 1);
};

const EmojiPanel = ({ baseHeight, isCompact, autoFocus, pinned, onSelect, onSearchingChange, onClose }) => {
  const [height, setHeight] = useState(baseHeight);
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef(null);
  const panelRef = useRef(null);
  useScreenBack(onClose);

  useEffect(() => {
    const panel = panelRef.current;
    const viewport = () => panel.querySelector("[frimousse-viewport]");
    const isOnGrip = (event) => Boolean(event.target.closest?.('[role="separator"]'));
    let sample = null;
    let pulled = 0;
    let touchY = null;
    let inputAt = -Infinity;

    const pullBack = (distance) => {
      if ((viewport()?.scrollTop ?? 0) > 0) {
        pulled = 0;
        return;
      }
      pulled += distance;
      if (pulled >= PULL_BACK) {
        pulled = 0;
        setHeight(baseHeight);
      }
    };

    const onScroll = (event) => {
      if (!event.target.matches?.("[frimousse-viewport]")) return;
      const now = performance.now();
      if (now - inputAt > INPUT_GRACE_MS) {
        sample = null;
        return;
      }
      const top = event.target.scrollTop;
      const isGoingDown = sample && top > sample.top;
      if (isGoingDown && now - sample.time < FLING_SAMPLE_MS) return;
      if (isGoingDown && (top - sample.top) / (now - sample.time) > FLING_SPEED) setHeight(tallestOf(panel, baseHeight));
      sample = { top, time: now };
    };
    const onWheel = (event) => {
      inputAt = performance.now();
      if (event.deltaY < 0) pullBack(-event.deltaY);
      else pulled = 0;
    };
    const onTouchStart = (event) => {
      touchY = event.touches[0].clientY;
      pulled = 0;
    };
    const onTouchMove = (event) => {
      if (isOnGrip(event)) return;
      inputAt = performance.now();
      const fingerY = event.touches[0].clientY;
      if (fingerY > touchY) pullBack(fingerY - touchY);
      touchY = fingerY;
    };

    panel.addEventListener("scroll", onScroll, true);
    panel.addEventListener("wheel", onWheel, { passive: true });
    panel.addEventListener("touchstart", onTouchStart, { passive: true });
    panel.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      panel.removeEventListener("scroll", onScroll, true);
      panel.removeEventListener("wheel", onWheel);
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchmove", onTouchMove);
    };
  }, [baseHeight]);

  const start = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = { y: event.clientY, time: event.timeStamp };
    drag.current = { startY: event.clientY, startHeight: height, tallest: tallestOf(panelRef.current, baseHeight), points: [point] };
    setIsDragging(true);
  };
  const move = (event) => {
    if (!drag.current) return;
    const recent = drag.current.points.filter((point) => event.timeStamp - point.time < RELEASE_SAMPLE_MS);
    drag.current.points = [...recent, { y: event.clientY, time: event.timeStamp }];
    setHeight(Math.min(drag.current.tallest, drag.current.startHeight + drag.current.startY - event.clientY));
  };
  const end = (event) => {
    if (!drag.current) return;
    const { tallest, startHeight, points } = drag.current;
    drag.current = null;
    setIsDragging(false);
    const upward = upwardSpeedAt(points, event.timeStamp);
    if (upward > FLICK_SPEED) return setHeight(tallest);
    if (upward < -FLICK_SPEED) return startHeight > baseHeight ? setHeight(baseHeight) : onClose();
    if (height < baseHeight * (1 - CLOSE_PULL)) return onClose();
    setHeight(height > (baseHeight + tallest) / 2 ? tallest : baseHeight);
  };

  return (
    <Box
      ref={panelRef}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
      // picking from the search's results keeps the field focused, so the keyboard stays up for the next one
      onMouseDown={(event) => !event.target.matches("input") && event.preventDefault()}
      onFocus={(event) => event.target.matches("input") && onSearchingChange?.(true)}
      onBlur={(event) => event.target.matches("input") && onSearchingChange?.(false)}
      sx={{
        height: Math.max(isCompact ? Math.min(height, SEARCHING_HEIGHT) : height, 0),
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: "hidden",
        pb: "env(safe-area-inset-bottom)",
        transition: isDragging ? "none" : "height 220ms cubic-bezier(0.2, 0.8, 0.3, 1)",
      }}
    >
      <Box
        role="separator"
        aria-label="Drag to resize the emoji panel"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        sx={{ flexShrink: 0, py: "14px", display: "grid", placeItems: "center", touchAction: "none", cursor: "grab" }}
      >
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "text.disabled" }} />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <EmojiPicker onSelect={onSelect} autoFocus={autoFocus} pinned={pinned} isPanel />
      </Box>
    </Box>
  );
};

export default EmojiPanel;
