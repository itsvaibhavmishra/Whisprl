import { useLayoutEffect, useRef, useState } from "react";
import { Box, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CameraIcon } from "@phosphor-icons/react";

import getAvatar from "@/utils/avatars";

// the pictures repeat on both sides, and a settled list jumps back to the middle copy, so it never runs out either way
const COPIES = 5;
const MIDDLE_COPY = Math.floor(COPIES / 2);
const SETTLE_MS = 90;
const RING_GAP = 5;

const sizesFor = (width) => {
  const slot = Math.min(112, Math.max(76, Math.round(width / 3.6)));
  return { slot, picture: Math.round(slot * 1.2) };
};

// styled directly on every scroll, since a re-render trails the finger and flickers as it settles
const sizeByDistance = (list, slot) => {
  [...list.children].forEach((item, position) => {
    const away = Math.min(Math.abs(position * slot - list.scrollLeft) / slot, 2);
    item.firstElementChild.style.transform = `scale(${1 - Math.min(away, 1) * 0.4 - Math.max(away - 1, 0) * 0.08})`;
    item.firstElementChild.style.opacity = 1 - Math.max(away - 1, 0) * 0.5;
  });
};

const AvatarCarousel = ({ choices, chosen, name, onChoose, onUpload }) => {
  const listRef = useRef(null);
  const settleRef = useRef(null);
  const [width, setWidth] = useState(0);
  const { slot, picture } = sizesFor(width);
  const count = choices.length;
  const chosenIndex = Math.max(
    0,
    choices.findIndex((choice) => choice.key === chosen)
  );

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(listRef.current.parentElement);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const list = listRef.current;
    const home = (MIDDLE_COPY * count + chosenIndex) * slot;
    if (width && Math.round(list.scrollLeft / slot) * slot !== home) list.scrollLeft = home;
    sizeByDistance(list, slot);
  }, [width, slot, count, chosenIndex]);

  const scrollBy = (steps) => listRef.current.scrollBy({ left: steps * slot, behavior: "smooth" });

  const settle = () => {
    const list = listRef.current;
    sizeByDistance(list, slot);
    clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      const index = Math.round(list.scrollLeft / slot) % count;
      list.scrollLeft = (MIDDLE_COPY * count + index) * slot;
      sizeByDistance(list, slot);
      if (choices[index].key !== chosen) onChoose(choices[index].key);
    }, SETTLE_MS);
  };

  const step = (event) => {
    const move = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!move) return;
    event.preventDefault();
    scrollBy(move);
  };

  const ring = picture + 2 * RING_GAP;
  const items = Array.from({ length: COPIES * count }, (_, position) => ({ ...choices[position % count], position }));

  return (
    // the page pads its sides, so the list reaches past them to run from edge to edge as a phone screen shows it
    <Box sx={{ position: "relative", left: { xs: -20, sm: -32 }, width: { xs: "calc(100% + 40px)", sm: "calc(100% + 64px)" } }}>
      <Box
        ref={listRef}
        role="listbox"
        aria-label="Profile picture"
        aria-activedescendant={`picture-${chosen}`}
        tabIndex={0}
        onScroll={settle}
        onKeyDown={step}
        sx={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          px: `calc(50% - ${slot / 2}px)`,
          py: `${RING_GAP + 4}px`,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          maskImage: "linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)",
          "&:focus-visible": { outline: "none" },
        }}
      >
        {items.map((item) => {
          const isHome = Math.floor(item.position / count) === MIDDLE_COPY;
          return (
            <Box
              key={item.position}
              id={isHome ? `picture-${item.key}` : undefined}
              role={isHome ? "option" : undefined}
              aria-selected={isHome ? item.key === chosen : undefined}
              aria-label={isHome ? item.label : undefined}
              aria-hidden={isHome ? undefined : true}
              onClick={() => scrollBy(Math.round((item.position * slot - listRef.current.scrollLeft) / slot))}
              sx={{
                flex: `0 0 ${slot}px`,
                minWidth: 0,
                height: picture,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                scrollSnapAlign: "center",
                cursor: "pointer",
              }}
            >
              <Box sx={{ flexShrink: 0 }}>{getAvatar(item.src, name, picture)}</Box>
            </Box>
          );
        })}
      </Box>
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 4,
          left: `calc(50% - ${ring / 2}px)`,
          width: ring,
          height: ring,
          borderRadius: "50%",
          border: 2,
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.45),
          boxShadow: (theme) => `0 0 12px ${alpha(theme.palette.primary.main, 0.25)}`,
          pointerEvents: "none",
        }}
      />
      <IconButton
        aria-label="Upload a photo"
        onClick={onUpload}
        sx={{
          position: "absolute",
          left: `calc(50% + ${picture / 2 - 30}px)`,
          top: picture - 26,
          bgcolor: "background.paper",
          boxShadow: 2,
          "&:hover": { bgcolor: "background.paper" },
        }}
      >
        <CameraIcon size={20} weight="bold" />
      </IconButton>
    </Box>
  );
};

export default AvatarCarousel;
