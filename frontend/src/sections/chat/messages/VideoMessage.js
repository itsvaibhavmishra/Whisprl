import { useState } from "react";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";
import { Play } from "phosphor-react";

import TransferRing, { useTransfer } from "@/sections/chat/messages/TransferRing";
import { openedFileUrl, ownUrlOf } from "@/utils/attachments";
import { formatDuration } from "@/utils/video";

const BUBBLE_WIDTH = 260;

export const VideoPoster = ({ file, fit = "cover", hasDuration = true, children }) => (
  <>
    {file.preview && <Box component="img" src={file.preview} alt="" sx={{ width: "100%", height: "100%", objectFit: fit, display: "block" }} />}
    <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", pointerEvents: "none", "& > *": { pointerEvents: "auto" } }}>
      {children}
    </Box>
    {hasDuration && (
      <Typography
        variant="caption"
        sx={{ position: "absolute", left: 8, bottom: 6, px: 0.75, borderRadius: 1, color: "#fff", bgcolor: "rgba(0, 0, 0, 0.55)", pointerEvents: "none" }}
      >
        {formatDuration(file.duration)}
      </Typography>
    )}
  </>
);

// a video downloads only when it is played, so nobody spends data on one they never watch
export const VideoPlayer = ({ file, sx }) => {
  const [openedUrl, setOpenedUrl] = useState(null);
  const [status, setStatus] = useState("idle");
  const transfer = useTransfer([file]);
  const ownUrl = ownUrlOf(file);
  const url = transfer ? null : ownUrl ?? openedUrl;
  const notice = (file.isLost && "Not sent") || (status === "failed" && "Could not open this video");
  const isWaiting = !transfer && !url && !notice && (status === "opening" || !file.sealed);

  const play = async () => {
    setStatus("opening");
    try {
      setOpenedUrl(await openedFileUrl(file.sealed));
      setStatus("playing");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <Box sx={{ position: "relative", bgcolor: "#000", overflow: "hidden", ...sx }}>
      {url ? (
        <Box
          component="video"
          src={url}
          controls
          playsInline
          autoPlay={status === "playing"}
          sx={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
        />
      ) : (
        <VideoPoster file={file}>
          {transfer && <TransferRing transfer={transfer} />}
          {isWaiting && <CircularProgress size={32} aria-label="Loading video" sx={{ color: "#fff" }} />}
          {notice && <Typography variant="caption">{notice}</Typography>}
          {!transfer && !isWaiting && !notice && (
            <ButtonBase
              onClick={play}
              aria-label={`Play video, ${formatDuration(file.duration)}`}
              sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "rgba(0, 0, 0, 0.55)" }}
            >
              <Play size={26} weight="fill" />
            </ButtonBase>
          )}
        </VideoPoster>
      )}
    </Box>
  );
};

const VideoMessage = ({ file }) => (
  <VideoPlayer
    file={file}
    sx={{
      width: BUBBLE_WIDTH,
      maxWidth: "100%",
      maxHeight: 360,
      aspectRatio: file.width && file.height ? `${file.width} / ${file.height}` : "16 / 9",
    }}
  />
);

export default VideoMessage;
