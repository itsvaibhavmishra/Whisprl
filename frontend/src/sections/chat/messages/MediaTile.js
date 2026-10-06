import { Box } from "@mui/material";
import { Play } from "phosphor-react";

import MessageImage from "@/sections/chat/messages/MessageImage";
import { VideoPoster } from "@/sections/chat/messages/VideoMessage";

const MediaTile = ({ file, fit = "cover" }) =>
  file.fileType === "video" ? (
    <Box sx={{ position: "relative", width: "100%", height: "100%", bgcolor: "#000" }}>
      <VideoPoster file={file} fit={fit}>
        <Play size={28} weight="fill" style={{ pointerEvents: "none" }} />
      </VideoPoster>
    </Box>
  ) : (
    <MessageImage file={file} fit={fit} />
  );

export default MediaTile;
