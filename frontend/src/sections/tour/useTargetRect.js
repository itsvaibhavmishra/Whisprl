import { useEffect, useState } from "react";

// the side bar and the phone's tab bar both carry the mark, and only one is on screen
const visibleTarget = (name) => [...document.querySelectorAll(`[data-tour="${name}"]`)].find((element) => element.getClientRects().length);

const isSameRect = (one, other) => one?.top === other?.top && one?.left === other?.left && one?.width === other?.width && one?.height === other?.height;

// followed every frame, since a page arriving, a list loading or the keyboard can all move the target
const useTargetRect = (name) => {
  // kept with the name it was measured for, so a new step never starts from the last step's place
  const [measured, setMeasured] = useState({ name: null, rect: null });

  useEffect(() => {
    if (!name) return undefined;
    let frame;
    const measure = () => {
      const next = visibleTarget(name)?.getBoundingClientRect() ?? null;
      setMeasured((previous) => (previous.name === name && isSameRect(previous.rect, next) ? previous : { name, rect: next }));
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [name]);

  return measured.name === name ? measured.rect : null;
};

export default useTargetRect;
