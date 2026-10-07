import { Box, Dialog, IconButton, Stack, Typography } from "@mui/material";
import { useReducedMotion } from "framer-motion";
import { X } from "phosphor-react";

const TITLE_ID = "photo-viewer-title";

// a profile picture is a plain address rather than an encrypted file, so it needs none of the message lightbox
const PhotoViewer = ({ src, name, onClose }) => {
  const isStill = useReducedMotion();
  const closeOnBackdrop = (event) => event.target === event.currentTarget && onClose();

  return (
    <Dialog
      open
      fullScreen
      onClose={onClose}
      transitionDuration={isStill ? 0 : undefined}
      aria-labelledby={TITLE_ID}
      PaperProps={{ sx: { bgcolor: "rgba(0, 0, 0, 0.94)", backgroundImage: "none" } }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1, px: 2, pt: "max(12px, env(safe-area-inset-top))", pb: 1.5, color: "#fff" }}
      >
        <Typography id={TITLE_ID} component="h2" noWrap sx={{ flex: 1, fontSize: 16, fontWeight: 700 }}>
          {name}
        </Typography>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ color: "#fff", bgcolor: "rgba(255, 255, 255, 0.1)", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" } }}
        >
          <X size={20} weight="bold" />
        </IconButton>
      </Stack>
      <Box onClick={closeOnBackdrop} sx={{ height: "100%", minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", px: 2, pt: 9, pb: 4 }}>
        <Box
          component="img"
          src={src}
          alt={`${name}, profile picture`}
          sx={{ width: "min(100%, 512px)", height: "auto", maxHeight: "100%", objectFit: "contain", borderRadius: 3 }}
        />
      </Box>
    </Dialog>
  );
};

export default PhotoViewer;
