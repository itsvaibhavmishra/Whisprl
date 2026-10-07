import { useState } from "react";
import { Box, Typography } from "@mui/material";

import MediaLightbox from "@/sections/chat/messages/MediaLightbox";
import MediaTile from "@/sections/chat/messages/MediaTile";
import { TransferOverlay, useTransfer } from "@/sections/chat/messages/TransferRing";
import { fileKeyOf, isMediaFile } from "@/utils/messageFiles";

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

// one circle for the whole group while it sends; opening it shows each file's own
const MediaMessage = ({ files }) => {
  const [viewing, setViewing] = useState(null);
  const media = files.filter(isMediaFile);
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
        {media.slice(0, MAX_VISIBLE).map((file, index) => (
          <Box
            key={fileKeyOf(file, index)}
            onClick={() => setViewing(index)}
            sx={{ position: "relative", overflow: "hidden", cursor: "pointer", ...cellStyleOf(media, index) }}
          >
            <MediaTile file={file} />
            {index === MAX_VISIBLE - 1 && extraCount > 0 && (
              <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "rgba(0, 0, 0, 0.55)" }}>
                <Typography variant="h5" sx={{ color: "#fff", fontWeight: 700 }}>
                  +{extraCount + 1}
                </Typography>
              </Box>
            )}
          </Box>
        ))}
        {transfer && <TransferOverlay transfer={transfer} />}
      </Box>

      <MediaLightbox open={viewing !== null} onClose={() => setViewing(null)} items={media} startIndex={viewing ?? 0} />
    </>
  );
};

export default MediaMessage;
