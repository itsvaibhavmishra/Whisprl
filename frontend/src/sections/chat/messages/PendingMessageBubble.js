import { Box, CircularProgress, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { X, ArrowCounterClockwise, File as FileIcon } from "phosphor-react";
import { useDispatch } from "react-redux";
import { CancelAttachment, RetryAttachment } from "@/redux/slices/actions/attachmentActions";
import { attachmentPreview } from "@/utils/attachments";

const PendingMessageBubble = ({ entry }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { attachment, caption, status } = entry;
  const { fileName } = attachment;
  const isImage = attachment.kind === "image";
  const preview = attachmentPreview(attachment.id);
  const isUploading = status === "sending";

  const handleCancel = () => dispatch(CancelAttachment(entry));
  const handleRetry = () => dispatch(RetryAttachment(entry));

  const overlayColor =
    isUploading
      ? "rgba(0,0,0,0.45)"
      : "rgba(180,0,0,0.55)";

  return (
    <Stack direction="row" justifyContent="flex-end" alignItems="center">
      <Box
        sx={{
          maxWidth: 200,
          borderRadius: "20px 20px 5px 20px",
          overflow: "hidden",
          backgroundColor: theme.palette.primary.main,
          opacity: 0.85,
        }}
      >
        {isImage ? (
          // Image pending bubble
          <Box sx={{ position: "relative", width: 180, height: 180 }}>
            {preview && (
              <Box
                component="img"
                src={preview}
                alt={fileName}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter:
                    isUploading
                      ? "blur(3px) brightness(0.6)"
                      : "blur(2px) brightness(0.4)",
                }}
              />
            )}

            {/* Overlay */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                backgroundColor: overlayColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isUploading ? (
                <CircularProgress size={32} sx={{ color: "#fff" }} />
              ) : (
                <IconButton onClick={handleRetry} aria-label={`Try sending ${fileName} again`} sx={{ color: "#fff" }}>
                  <ArrowCounterClockwise size={28} weight="bold" />
                </IconButton>
              )}
            </Box>

            {/* Top-right action button */}
            <IconButton
              size="small"
              onClick={handleCancel}
              aria-label={isUploading ? `Cancel ${fileName}` : `Discard ${fileName}`}
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                color: "#fff",
                backgroundColor: "rgba(0,0,0,0.4)",
                p: 0.4,
                "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
              }}
            >
              <X size={14} weight="bold" />
            </IconButton>
          </Box>
        ) : (
          // Document pending bubble
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ p: 1, pr: 1.5, minWidth: 180, position: "relative" }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                backgroundColor: "rgba(255,255,255,0.15)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              {isUploading ? (
                <CircularProgress size={18} sx={{ color: "#fff" }} />
              ) : (
                <FileIcon size={20} color="#fff" />
              )}
            </Box>
            <Typography
              variant="body2"
              noWrap
              sx={{ flex: 1, maxWidth: 120, color: "#fff" }}
            >
              {fileName}
            </Typography>

            {/* Action button */}
            <IconButton
              size="small"
              onClick={handleCancel}
              aria-label={isUploading ? `Cancel ${fileName}` : `Discard ${fileName}`}
              sx={{ color: "#fff", p: 0.3 }}
            >
              <X size={14} weight="bold" />
            </IconButton>
          </Stack>
        )}

        {/* Caption */}
        {caption && (
          <Typography
            variant="body2"
            sx={{ px: 1.5, pb: 1, pt: 0.5, color: "#fff", wordBreak: "break-word" }}
          >
            {caption}
          </Typography>
        )}

        {!isImage && !isUploading && (
          <Box sx={{ px: 1.5, pb: 1 }}>
            <Typography
              component="button"
              type="button"
              variant="caption"
              sx={{
                p: 0,
                border: 0,
                background: "none",
                color: "rgba(255,255,255,0.8)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={handleRetry}
            >
              Not sent. Tap to try again.
            </Typography>
          </Box>
        )}
      </Box>
    </Stack>
  );
};

export default PendingMessageBubble;
