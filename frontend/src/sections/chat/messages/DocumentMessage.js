import { Box, Stack, Typography, IconButton, useTheme } from "@mui/material";
import { DownloadSimple, File as FileIcon } from "phosphor-react";

const DocumentMessage = ({ files }) => {
  const theme = useTheme();
  const docFiles = files.filter((f) => f.fileType === "document");

  return (
    <Stack spacing={0.5}>
      {docFiles.map((file, index) => (
        <Stack
          key={index}
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{
            backgroundColor: theme.palette.background.default,
            borderRadius: 1.5,
            p: 1,
            pr: 1.5,
            minWidth: 200,
          }}
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

          <Typography
            variant="body2"
            noWrap
            sx={{ flex: 1, maxWidth: 160 }}
          >
            {file.fileName}
          </Typography>

          <IconButton
            size="small"
            component="a"
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            download
          >
            <DownloadSimple size={18} />
          </IconButton>
        </Stack>
      ))}
    </Stack>
  );
};

export default DocumentMessage;
