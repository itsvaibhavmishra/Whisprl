import { useEffect } from "react";

const SETTLE_MS = 1200;

const DAY_LABEL = "[data-day-label]";

// a day's label floats over the messages only while they scroll, so at rest it never covers one
export const useFloatingDayLabels = (scrollRef) => {
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;
    let settleTimer;
    let frame;

    const markStuckLabels = () => {
      frame = null;
      const top = scroller.getBoundingClientRect().top;
      scroller.querySelectorAll(DAY_LABEL).forEach((label) => {
        label.dataset.stuck = String(label.parentElement.getBoundingClientRect().top < top);
      });
    };

    const handleScroll = () => {
      scroller.dataset.scrolling = "true";
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        scroller.dataset.scrolling = "false";
      }, SETTLE_MS);
      if (!frame) frame = requestAnimationFrame(markStuckLabels);
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      clearTimeout(settleTimer);
      cancelAnimationFrame(frame);
    };
  }, [scrollRef]);
};

export const floatingDayLabelStyles = {
  [`& ${DAY_LABEL}`]: { transition: "opacity 240ms ease" },
  [`& ${DAY_LABEL}[data-stuck="true"]`]: { opacity: 0 },
  [`&[data-scrolling="true"] ${DAY_LABEL}`]: { opacity: 1 },
  [`& ${DAY_LABEL}[data-stuck="true"] p`]: {
    bgcolor: "chat.raised",
    boxShadow: (theme) => `0 2px 8px ${theme.palette.chat.shade}, 0 0 0 1px ${theme.palette.chat.edge}`,
  },
};
