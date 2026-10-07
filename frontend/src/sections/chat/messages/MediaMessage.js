import { useRef, useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";

import MediaTile from "@/sections/chat/messages/MediaTile";
import { TransferOverlay, useTransfer } from "@/sections/chat/messages/TransferRing";
import MediaViewer from "@/sections/chat/viewer/MediaViewer";
import { mediaKeyOf } from "@/sections/chat/viewer/mediaItems";
import { formatDuration } from "@/utils/video";

const GRID_CELL_SIZE = 130;
const MAX_VISIBLE = 4;

const gridStyleOf = (total) => {
  if (total === 1) return { gridTemplateColumns: "1fr", gridTemplateRows: "auto" };
  if (total === 2) return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: `${GRID_CELL_SIZE}px` };
  return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: `${GRID_CELL_SIZE}px ${GRID_CELL_SIZE}px` };
};

const cellStyleOf = (media, index) => {
  if (media.length === 1) {
    const { width, height } = media[0];
    return { gridColumn: "1 / -1", maxHeight: 300, ...(width && height && { aspectRatio: `${width} / ${height}` }) };
  }
  if (media.length === 3 && index === 0) return { gridColumn: "1 / -1", height: GRID_CELL_SIZE };
  return { height: GRID_CELL_SIZE };
};

const labelOf = (file) => (file.fileType === "video" ? `Open video, ${formatDuration(file.duration)}` : "Open photo");

// one circle for the whole group while it sends; opening it shows each file's own
const MediaMessage = ({ items, conversation }) => {
  const [viewing, setViewing] = useState(null);
  const tiles = useRef([]);
  const media = items.map((item) => item.file);
  const transfer = useTransfer(media);
  if (!media.length) return null;

  const extraCount = media.length - MAX_VISIBLE;

  return (
    <>
      <Box
        sx={{
          position: "relative",
          display: "grid",
          gap: "2px",
          // a set width, since a photo still decrypting has no size of its own to give the bubble
          width: media.length === 1 ? 260 : GRID_CELL_SIZE * 2 + 2,
          maxWidth: "100%",
          borderRadius: "inherit",
          overflow: "hidden",
          ...gridStyleOf(media.length),
        }}
      >
        {items.slice(0, MAX_VISIBLE).map((item, index) => (
          <ButtonBase
            key={mediaKeyOf(item)}
            ref={(node) => {
              tiles.current[index] = node;
            }}
            onClick={() => setViewing(index)}
            aria-label={labelOf(item.file)}
            sx={{ position: "relative", overflow: "hidden", "&.Mui-focusVisible": { outline: "2px solid #fff", outlineOffset: -4 }, ...cellStyleOf(media, index) }}
          >
            <MediaTile file={item.file} />
            {index === MAX_VISIBLE - 1 && extraCount > 0 && (
              <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "rgba(0, 0, 0, 0.55)" }}>
                <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>
                  +{extraCount + 1}
                </Typography>
              </Box>
            )}
          </ButtonBase>
        ))}
        {transfer && <TransferOverlay transfer={transfer} />}
      </Box>

      {viewing !== null && (
        <MediaViewer
          items={items}
          startIndex={viewing}
          conversation={conversation}
          tileOf={(index) => tiles.current[Math.min(index, MAX_VISIBLE - 1)]}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
};

export default MediaMessage;
