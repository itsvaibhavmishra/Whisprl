import { Box, Stack, Typography, useTheme } from "@mui/material";
import { File as FileIcon } from "phosphor-react";
import { useSelector } from "react-redux";

const FileBody = () => {
  const theme = useTheme();
  const { files, activeFileIndex } = useSelector((state) => state.chat);

  const activeFile = files[activeFileIndex];

  if (!activeFile) return null;

  const isImage = activeFile.actionType === "image";

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        p: 2,
      }}
    >
      {isImage ? (
        <Box
          component="img"
          src={activeFile.dataUrl || URL.createObjectURL(activeFile.file)}
          alt={activeFile.fileName}
          sx={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: 2,
          }}
        />
      ) : (
        <Stack alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              backgroundColor: theme.palette.background.default,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FileIcon size={40} color={theme.palette.primary.main} />
          </Box>
          <Typography variant="subtitle2" noWrap sx={{ maxWidth: 250 }}>
            {activeFile.fileName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {activeFile.type} &middot;{" "}
            {(activeFile.file.size / (1024 * 1024)).toFixed(2)} MB
          </Typography>
        </Stack>
      )}
    </Box>
  );
};

export default FileBody;
