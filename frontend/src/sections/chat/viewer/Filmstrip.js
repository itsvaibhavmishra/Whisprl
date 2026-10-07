import { useEffect, useRef } from "react";
import { ButtonBase, Stack } from "@mui/material";
import { useReducedMotion } from "framer-motion";

import MediaTile from "@/sections/chat/messages/MediaTile";
import { mediaKeyOf } from "@/sections/chat/viewer/mediaItems";

const TILE = { xs: 46, md: 54 };
const EASE_OUT = "cubic-bezier(0.33, 1, 0.68, 1)";

// the photo on screen takes its own shape in the strip, within limits, so it stands out without a label
const shapeOf = ({ width, height }) => (width && height ? Math.min(1.6, Math.max(0.7, width / height)) : 1);

const Filmstrip = ({ items, index, onPick }) => {
  const isStill = useReducedMotion();
  const strip = useRef(null);
  const active = useRef(null);

  // the strip alone scrolls, since scrollIntoView would also slide the whole viewer to centre the tile
  useEffect(() => {
    if (!active.current) return;
    const tile = active.current.getBoundingClientRect();
    const bounds = strip.current.getBoundingClientRect();
    strip.current.scrollBy({ left: tile.left + tile.width / 2 - (bounds.left + bounds.width / 2), behavior: isStill ? "auto" : "smooth" });
  }, [index, isStill]);

  return (
    <Stack ref={strip} direction="row" spacing={0.75} sx={{ maxWidth: "100%", overflowX: "auto", p: 0.75, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
      {items.map((item, itemIndex) => {
        const isActive = itemIndex === index;
        const shape = isActive ? shapeOf(item.file) : 1;
        return (
          <ButtonBase
            key={mediaKeyOf(item)}
            ref={isActive ? active : undefined}
            onClick={() => onPick(itemIndex)}
            aria-label={`${item.file.fileType === "video" ? "Video" : "Photo"} ${itemIndex + 1} of ${items.length}`}
            aria-current={isActive || undefined}
            sx={{
              flexShrink: 0,
              width: { xs: TILE.xs * shape, md: TILE.md * shape },
              height: TILE,
              borderRadius: "10px",
              overflow: "hidden",
              opacity: isActive ? 1 : 0.45,
              transform: isActive ? "none" : "scale(0.88)",
              boxShadow: (theme) => (isActive ? `0 0 0 2px ${theme.palette.primary.glow}` : "none"),
              transition: `opacity 180ms ease, transform 220ms ${EASE_OUT}, width 220ms ${EASE_OUT}`,
              "&:hover": { opacity: isActive ? 1 : 0.8 },
              "&.Mui-focusVisible": { outline: "2px solid #fff", outlineOffset: 2 },
            }}
          >
            <MediaTile file={item.file} isSmall />
          </ButtonBase>
        );
      })}
    </Stack>
  );
};

export default Filmstrip;
