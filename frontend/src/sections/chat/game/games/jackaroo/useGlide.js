import { useLayoutEffect, useRef } from "react";

const GLIDE_MS = 260;

// whatever in a row is marked data-glide slides from where it sat to where it sits now, so a card leaving or arriving never makes the rest jump
const useGlide = (rowRef, isStill) => {
  const places = useRef(new Map());
  useLayoutEffect(() => {
    const elements = [...(rowRef.current?.querySelectorAll("[data-glide]") ?? [])];
    // every place is read before any glide starts, so the row is laid out once rather than once per card; offsetLeft ignores running animations
    const now = new Map(elements.map((element) => [element.dataset.glide, element.offsetLeft]));
    const before = places.current;
    places.current = now;
    if (isStill) return;
    elements.forEach((element) => {
      const was = before.get(element.dataset.glide);
      const shift = was === undefined ? 0 : was - now.get(element.dataset.glide);
      if (Math.abs(shift) < 1) return;
      element.animate([{ transform: `translateX(${shift}px)` }, { transform: "translateX(0)" }], {
        duration: GLIDE_MS,
        easing: "cubic-bezier(0.2, 0.8, 0.3, 1)",
        composite: "add",
      });
    });
  });
};

export default useGlide;
