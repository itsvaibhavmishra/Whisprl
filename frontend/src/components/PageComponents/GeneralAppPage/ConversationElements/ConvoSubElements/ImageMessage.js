import { useState } from "react";
import { Box, Typography } from "@mui/material";
import ImageLightbox from "./ImageLightbox";

const GRID_CELL_SIZE = 130;
const MAX_VISIBLE = 4;

const ImageMessage = ({ files }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);

  const imageFiles = files.filter((f) => f.fileType === "image");
  const total = imageFiles.length;
  if (total === 0) return null;

  const visibleImages = imageFiles.slice(0, MAX_VISIBLE);
  const extraCount = total - MAX_VISIBLE;

  const openLightbox = (index) => {
    setLightboxStart(index);
    setLightboxOpen(true);
  };

  // Layout logic
  const getGridStyle = () => {
    if (total === 1) return { gridTemplateColumns: "1fr", gridTemplateRows: "auto" };
    if (total === 2) return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: `${GRID_CELL_SIZE}px` };
    if (total === 3) return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: `${GRID_CELL_SIZE}px ${GRID_CELL_SIZE}px` };
    // 4+
    return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: `${GRID_CELL_SIZE}px ${GRID_CELL_SIZE}px` };
  };

  const getCellStyle = (index) => {
    if (total === 1) {
      return { gridColumn: "1 / -1", height: "auto", maxHeight: 300 };
    }
    if (total === 3 && index === 0) {
      return { gridColumn: "1 / -1", height: GRID_CELL_SIZE };
    }
    return { height: GRID_CELL_SIZE };
  };

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gap: "2px",
          maxWidth: total === 1 ? 260 : GRID_CELL_SIZE * 2 + 2,
          borderRadius: "inherit",
          overflow: "hidden",
          ...getGridStyle(),
        }}
      >
        {visibleImages.map((file, index) => {
          const isLast = index === MAX_VISIBLE - 1;
          const showOverlay = isLast && extraCount > 0;

          return (
            <Box
              key={index}
              onClick={() => openLightbox(index)}
              sx={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                ...getCellStyle(index),
              }}
            >
              <Box
                component="img"
                src={file.url}
                alt={file.fileName}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  transition: "opacity 0.2s",
                  "&:hover": { opacity: showOverlay ? 1 : 0.9 },
                }}
              />
              {showOverlay && (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => openLightbox(index)}
                >
                  <Typography
                    variant="h5"
                    sx={{ color: "#fff", fontWeight: 700 }}
                  >
                    +{extraCount + 1}
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <ImageLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={imageFiles}
        startIndex={lightboxStart}
      />
    </>
  );
};

export default ImageMessage;
