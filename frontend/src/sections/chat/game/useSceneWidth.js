import { useEffect, useRef, useState } from "react";

// close enough to the panel's width that a blurred strip beside the scene would only look like a mistake
const SNAP = 24;

// as wide as the panel, narrowed only so the masthead leaves the controls their room, and never so narrow it ends above the bottom
export const sceneWidthOf = ({ width, height, inset }, controls, art, mastheadRatio) => {
  const fitted = Math.min(width, (height - inset - controls) * mastheadRatio);
  const sceneWidth = Math.max(fitted, height * art.ratio);
  return width - sceneWidth < SNAP ? Math.max(width, sceneWidth) : sceneWidth;
};

// the panel's size and its inset at the foot, where a phone's chat floats over the art
const useSceneWidth = (art, mastheadRatio, controls) => {
  const ref = useRef(null);
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || art.anchor !== "top") return undefined;
    const measure = () => setRoom({ width: node.offsetWidth, height: node.offsetHeight, inset: parseFloat(getComputedStyle(node).paddingBottom) || 0 });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [art.anchor]);

  const sceneWidth = room && sceneWidthOf(room, controls, art, mastheadRatio);
  return [ref, sceneWidth, Boolean(room && sceneWidth < room.width)];
};

export default useSceneWidth;
