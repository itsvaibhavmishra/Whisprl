import { Box, CircularProgress, Typography } from "@mui/material";

import useFileUrl from "@/hooks/useFileUrl";

const MessageImage = ({ file, fit = "cover" }) => {
  const { url, failed } = useFileUrl(file);
  const notice = (file.isLost && "Not sent") || (failed && "Could not open this photo");
  const isWaiting = !notice && (file.isUploading || !url);
  const source = url || file.preview;

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", bgcolor: "action.hover" }}>
      {source && (
        <Box
          component="img"
          src={source}
          alt={file.fileName}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: fit,
            display: "block",
            ...(!url && { filter: "blur(8px)", transform: "scale(1.1)" }),
          }}
        />
      )}
      {isWaiting && (
        <CircularProgress size={28} aria-label="Loading photo" sx={{ position: "absolute", inset: 0, m: "auto", color: "#fff" }} />
      )}
      {notice && (
        <Typography variant="caption" sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff" }}>
          {notice}
        </Typography>
      )}
    </Box>
  );
};

export default MessageImage;
