import { useEffect, useRef, useState } from "react";

import { TICK, feel } from "@/utils/haptics";

// how far the finger's pull shows the indicator before letting go reloads
export const PULL_TO_RELOAD = 72;
const FURTHEST = 110;
// the indicator trails the finger, so a pull takes a deliberate reach rather than an ordinary scroll
const RESISTANCE = 0.5;

const isAtEdge = (node, edge) => (edge === "top" ? node.scrollTop <= 0 : node.scrollTop + node.clientHeight >= node.scrollHeight - 1);

// a list pulled past its edge by a finger, top or bottom, reloads only if the pull is let go fully shown
const usePullToRefresh = (scrollRef, onRefresh, { edge = "top", isEnabled = true } = {}) => {
  const [pull, setPull] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refresh = useRef(onRefresh);
  refresh.current = onRefresh;

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !isEnabled) return undefined;
    let startY = null;
    let shown = 0;
    let isBusy = false;

    const show = (distance) => {
      if (shown < PULL_TO_RELOAD !== distance < PULL_TO_RELOAD) feel(TICK);
      shown = distance;
      setPull(distance);
    };

    const onStart = (event) => {
      startY = !isBusy && event.touches.length === 1 && isAtEdge(node, edge) ? event.touches[0].clientY : null;
      shown = 0;
    };

    const onMove = (event) => {
      if (startY === null) return;
      const travel = (event.touches[0].clientY - startY) * (edge === "top" ? 1 : -1);
      if (travel <= 0) {
        if (shown) show(0);
        if (!isAtEdge(node, edge)) startY = null;
        return;
      }
      // the pull is shown instead of the list bouncing or scrolling under the finger
      if (event.cancelable) event.preventDefault();
      show(Math.min(FURTHEST, travel * RESISTANCE));
    };

    const onEnd = async () => {
      if (startY === null) return;
      startY = null;
      if (shown < PULL_TO_RELOAD) return show(0);
      isBusy = true;
      setIsRefreshing(true);
      setPull(PULL_TO_RELOAD);
      try {
        await refresh.current();
      } finally {
        isBusy = false;
        shown = 0;
        setIsRefreshing(false);
        setPull(0);
      }
    };

    // a gesture the phone takes over was never let go, so it puts the pull away rather than reloading
    const onCancel = () => {
      if (startY === null) return;
      startY = null;
      show(0);
    };

    node.addEventListener("touchstart", onStart, { passive: true });
    node.addEventListener("touchmove", onMove, { passive: false });
    node.addEventListener("touchend", onEnd);
    node.addEventListener("touchcancel", onCancel);
    return () => {
      node.removeEventListener("touchstart", onStart);
      node.removeEventListener("touchmove", onMove);
      node.removeEventListener("touchend", onEnd);
      node.removeEventListener("touchcancel", onCancel);
    };
  }, [scrollRef, edge, isEnabled]);

  return { pull, isRefreshing };
};

export default usePullToRefresh;
