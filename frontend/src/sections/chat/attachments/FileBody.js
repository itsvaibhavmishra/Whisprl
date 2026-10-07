import { Box, Stack, Typography } from "@mui/material";
import { File as FileIcon } from "phosphor-react";
import { useSelector } from "react-redux";

import { attachmentUrl } from "@/utils/attachments";
import { gradientOf } from "@/utils/gradients";

const PREVIEW = { maxWidth: "100%", maxHeight: "100%", borderRadius: 2.5, boxShadow: (theme) => `0 24px 48px -16px ${theme.palette.chat.shade}` };

const FileBody = () => {
  const { files, activeFileIndex } = useSelector((state) => state.chat);

  const activeFile = files[activeFileIndex];

  if (!activeFile) return null;

  const preview = () => {
    if (activeFile.kind === "video") {
      return <Box component="video" key={activeFile.id} src={attachmentUrl(activeFile.id)} poster={activeFile.preview} controls playsInline sx={PREVIEW} />;
    }
    if (activeFile.kind === "image") {
      return <Box component="img" src={attachmentUrl(activeFile.id)} alt={activeFile.fileName} sx={{ ...PREVIEW, objectFit: "contain" }} />;
    }
    return (
      <Stack alignItems="center" spacing={1.5} sx={{ px: 5, py: 4, borderRadius: 5, bgcolor: "chat.pill", maxWidth: 360 }}>
        <Box sx={{ width: 72, height: 72, borderRadius: 4, display: "grid", placeItems: "center", color: "#fff", background: (theme) => gradientOf(theme.palette.primary.bubble) }}>
          <FileIcon size={36} weight="fill" />
        </Box>
        <Typography noWrap sx={{ maxWidth: 260, fontSize: 15, fontWeight: 800 }}>
          {activeFile.fileName}
        </Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
          {activeFile.typeLabel}, {(activeFile.size / (1024 * 1024)).toFixed(2)} MB
        </Typography>
      </Stack>
    );
  };

  return <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", p: 2 }}>{preview()}</Box>;
};

export default FileBody;
