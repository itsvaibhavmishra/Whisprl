import { useCallback, useRef } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";

const FLIGHT = { type: "spring", stiffness: 380, damping: 36 };
const STILL = { duration: 0 };
const FADE = { duration: 0.22, ease: "easeOut" };
const FROM_NOWHERE = { x: 0, y: 0, scale: 0.92 };

const isOnScreen = (rect) => Boolean(rect?.width) && rect.bottom > 0 && rect.top < window.innerHeight;

// where the photo sits once every gesture and flight is undone, added up from offsets since they ignore transforms
const restingBoxOf = (frame) => {
  const slide = frame.offsetParent;
  const { left, top } = slide.offsetParent.getBoundingClientRect();
  return { left: left + slide.offsetLeft + frame.offsetLeft, top: top + slide.offsetTop + frame.offsetTop, width: frame.offsetWidth, height: frame.offsetHeight };
};

const offsetsOver = (tile, box) => ({
  x: tile.left + tile.width / 2 - (box.left + box.width / 2),
  y: tile.top + tile.height / 2 - (box.top + box.height / 2),
  scale: Math.min(tile.width / box.width, tile.height / box.height),
});

const useFlight = (dragY, openedFrom) => {
  const flight = useReducedMotion() ? STILL : FLIGHT;
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0);
  const openness = useMotionValue(0);
  const frame = useRef(null);

  const offsetsFrom = useCallback((tile) => (isOnScreen(tile) ? offsetsOver(tile, restingBoxOf(frame.current)) : FROM_NOWHERE), []);

  // the portal mounts a step after the viewer, so the flight starts as the first photo arrives; a leaving slide never clears the ref
  const holdFrame = useCallback(
    (node) => {
      if (!node) return;
      const isFirst = !frame.current;
      frame.current = node;
      if (!isFirst) return;
      const from = offsetsFrom(openedFrom);
      offsetX.set(from.x);
      offsetY.set(from.y);
      scale.set(from.scale);
      animate(offsetX, 0, flight);
      animate(offsetY, 0, flight);
      animate(scale, 1, flight);
      animate(opacity, 1, { duration: 0.12 });
      animate(openness, 1, FADE);
    },
    [offsetsFrom, openedFrom, flight, offsetX, offsetY, scale, opacity, openness]
  );

  const land = (tile) => {
    const to = offsetsFrom(tile);
    return Promise.all([
      animate(offsetX, to.x, flight),
      animate(offsetY, to.y, flight),
      animate(scale, to.scale, flight),
      animate(dragY, 0, flight),
      animate(opacity, 0, { duration: 0.14, delay: 0.16 }),
      animate(openness, 0, FADE),
    ]);
  };

  return { holdFrame, frameStyle: { x: offsetX, y: offsetY, scale, opacity }, openness, land };
};

export default useFlight;
