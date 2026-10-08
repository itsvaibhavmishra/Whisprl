import { useEffect, useRef } from "react";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";

import useFileUrl from "@/hooks/useFileUrl";

// a photo or video is downloaded and decrypted before its time starts running
const StatusMedia = ({ status, isPaused, onReady, onMention }) => {
  const video = useRef(null);
  const { file, mentions = [] } = status.content;
  const alt = status.content.alt || status.content.caption;
  const { url, failed } = useFileUrl({ sealed: { ...file, url: status.file.url } });

  useEffect(() => {
    if (failed) onReady();
  }, [failed, onReady]);

  useEffect(() => {
    if (!video.current) return;
    if (isPaused) video.current.pause();
    else video.current.play().catch(() => {});
  }, [isPaused]);

  if (failed) return <Typography sx={{ color: "#fff" }}>This status could not be opened</Typography>;

  const sx = { width: "100%", height: "100%", objectFit: "contain", display: "block" };
  const shape = file.width && file.height ? { width: `min(100cqw, 100cqh * ${file.width / file.height})`, aspectRatio: `${file.width} / ${file.height}` } : { width: "100%", height: "100%" };
  // above the previous and next areas so a mention can be tapped, and see-through to taps everywhere else
  return (
    <Box sx={{ position: "relative", zIndex: 2, pointerEvents: "none", width: "100%", height: "100%", display: "grid", placeItems: "center", containerType: "size" }}>
      {!url && file.preview && <Box component="img" src={file.preview} alt="" sx={{ ...sx, position: "absolute", inset: 0, filter: "blur(16px)" }} />}
      {!url && <CircularProgress aria-label="Opening status" sx={{ color: "#fff", position: "absolute" }} />}
      <Box sx={{ position: "relative", ...shape }}>
        {url && status.content.kind === "video" && (
          <Box component="video" ref={video} src={url} autoPlay playsInline onPlaying={onReady} aria-label={alt || "Video status"} sx={sx} />
        )}
        {url && status.content.kind === "image" && <Box component="img" src={url} alt={alt || "Photo status"} onLoad={onReady} sx={sx} />}
        {url &&
          mentions.map(({ userId, username, box }, index) => (
            <ButtonBase
              key={`${userId}-${index}`}
              aria-label={`Open @${username}'s profile`}
              onClick={() => onMention(userId)}
              sx={{ position: "absolute", left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%`, borderRadius: 99, pointerEvents: "auto" }}
            />
          ))}
      </Box>
    </Box>
  );
};

export default StatusMedia;
