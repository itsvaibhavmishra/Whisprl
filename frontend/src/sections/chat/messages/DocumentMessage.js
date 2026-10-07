import { Box, CircularProgress, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { DownloadSimple, File as FileIcon } from "phosphor-react";

import useFileUrl from "@/hooks/useFileUrl";
import { downloadFile } from "@/utils/attachments";

const CAPTIONS = { lost: "Not sent", failed: "Could not open", uploading: "Uploading…" };

const statusOf = (file, url, failed) => {
  if (file.isLost) return "lost";
  if (failed) return "failed";
  if (file.isUploading) return "uploading";
  return url ? "ready" : "opening";
};

const sizeOf = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`);

const DocumentRow = ({ file }) => {
  const theme = useTheme();
  const { url, failed } = useFileUrl(file);
  const status = statusOf(file, url, failed);
  const caption = CAPTIONS[status] ?? (file.size && sizeOf(file.size));

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{ backgroundColor: theme.palette.background.default, borderRadius: 1.5, p: 1, pr: 1.5, minWidth: 200 }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          backgroundColor: theme.palette.background.paper,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FileIcon size={20} color={theme.palette.primary.main} />
      </Box>

      <Stack sx={{ flex: 1, minWidth: 0, maxWidth: 160 }}>
        <Typography data-searchable variant="body2" noWrap>
          {file.fileName}
        </Typography>
        {caption && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {caption}
          </Typography>
        )}
      </Stack>

      {status === "ready" && (
        <IconButton size="small" aria-label={`Download ${file.fileName}`} onClick={() => downloadFile(url, file.fileName)}>
          <DownloadSimple size={18} />
        </IconButton>
      )}
      {(status === "uploading" || status === "opening") && <CircularProgress size={18} aria-label={`Preparing ${file.fileName}`} />}
    </Stack>
  );
};

const DocumentMessage = ({ files }) => (
  <Stack spacing={0.5}>
    {files
      .filter((file) => file.fileType === "document")
      .map((file, index) => (
        <DocumentRow key={file.localId ?? index} file={file} />
      ))}
  </Stack>
);

export default DocumentMessage;
