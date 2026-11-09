import { useEffect, useState } from "react";

// the side bar and the phone's tab bar both carry the mark, and only one is on screen
const visibleTarget = (name) => [...document.querySelectorAll(`[data-tour="${name}"]`)].find((element) => element.getClientRects().length);

const isSameRect = (one, other) => one?.top === other?.top && one?.left === other?.left && one?.width === other?.width && one?.height === other?.height;

// followed every frame, since a page arriving, a list loading or the keyboard can all move the target
const useTargetRect = (name) => {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!name) return undefined;
    let frame;
    const measure = () => {
      const next = visibleTarget(name)?.getBoundingClientRect() ?? null;
      setRect((previous) => (isSameRect(previous, next) ? previous : next));
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [name]);

  return name ? rect : null;
};

export default useTargetRect;
