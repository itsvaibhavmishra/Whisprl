import { Box } from "@mui/material";
import { PlayIcon } from "@phosphor-icons/react";

import MessageImage from "@/sections/chat/messages/MessageImage";
import { VideoPoster } from "@/sections/chat/messages/VideoMessage";

// a small tile leaves out a video's length, which would cover most of it
const MediaTile = ({ file, fit = "cover", isSmall = false }) =>
  file.fileType === "video" ? (
    <Box sx={{ position: "relative", width: "100%", height: "100%", bgcolor: "#000" }}>
      <VideoPoster file={file} fit={fit} hasDuration={!isSmall}>
        <PlayIcon size={isSmall ? 16 : 28} weight="fill" style={{ pointerEvents: "none" }} />
      </VideoPoster>
    </Box>
  ) : (
    <MessageImage file={file} fit={fit} />
  );

export default MediaTile;
