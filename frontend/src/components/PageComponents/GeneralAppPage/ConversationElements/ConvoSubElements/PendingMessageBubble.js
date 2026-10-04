import { useState } from "react";
import { Box, CircularProgress, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { X, ArrowCounterClockwise, File as FileIcon } from "phosphor-react";
import { useDispatch } from "react-redux";
import { removePendingMessage, updatePendingMessage, addMessageFromUpload } from "@/redux/slices/chatSlice";
import { UploadFileMessage, uploadAbortControllers } from "@/redux/slices/actions/chatActions";
import { socket } from "@/utils/socket";
// uuidv4 not needed in PendingMessageBubble — retries reuse existing localId

// Renders a single pending file upload bubble (uploading | failed | cancelled)
const PendingMessageBubble = ({ pending }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { localId, batchId, batchIndex, batchTotal, dataUrl, fileName, actionType, caption, status, file, convo_id } = pending;
  const isImage = actionType === "image";
  const [retrying, setRetrying] = useState(false);

  const handleCancel = () => {
    const controller = uploadAbortControllers.get(localId);
    if (controller) {
      controller.abort();
    }
    dispatch(updatePendingMessage({ localId, status: "cancelled" }));
  };

  const handleDiscard = () => {
    dispatch(removePendingMessage(localId));
  };

  const handleRetry = async () => {
    setRetrying(true);
    dispatch(updatePendingMessage({ localId, status: "uploading" }));
    const controller = new AbortController();
    uploadAbortControllers.set(localId, controller);

    const result = await dispatch(
      UploadFileMessage({
        file,
        convo_id,
        caption,
        localId,
        batchId,
        batchIndex,
        batchTotal,
        signal: controller.signal,
      })
    );

    uploadAbortControllers.delete(localId);
    setRetrying(false);

    if (!result.error && result.payload?.message) {
      dispatch(addMessageFromUpload(result.payload.message));
      socket.emit("send_message", result.payload.message);
    }
  };

  const overlayColor =
    status === "uploading"
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
            {dataUrl && (
              <Box
                component="img"
                src={dataUrl}
                alt={fileName}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  filter:
                    status === "uploading"
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
              {status === "uploading" && (
                <CircularProgress size={32} sx={{ color: "#fff" }} />
              )}
              {(status === "failed" || status === "cancelled") && (
                <IconButton onClick={handleRetry} disabled={retrying} sx={{ color: "#fff" }}>
                  {retrying ? (
                    <CircularProgress size={24} sx={{ color: "#fff" }} />
                  ) : (
                    <ArrowCounterClockwise size={28} weight="bold" />
                  )}
                </IconButton>
              )}
            </Box>

            {/* Top-right action button */}
            <IconButton
              size="small"
              onClick={status === "uploading" ? handleCancel : handleDiscard}
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
              {status === "uploading" ? (
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
              onClick={status === "uploading" ? handleCancel : handleDiscard}
              sx={{ color: "#fff", p: 0.3 }}
            >
              <X size={14} weight="bold" />
            </IconButton>
          </Stack>
        )}

        {/* Caption */}
        {batchIndex === 0 && caption && (
          <Typography
            variant="body2"
            sx={{ px: 1.5, pb: 1, pt: 0.5, color: "#fff", wordBreak: "break-word" }}
          >
            {caption}
          </Typography>
        )}

        {/* Retry label for docs */}
        {!isImage && (status === "failed" || status === "cancelled") && (
          <Box sx={{ px: 1.5, pb: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.8)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onClick={handleRetry}
            >
              {retrying ? "Retrying..." : "Tap to retry"}
            </Typography>
          </Box>
        )}
      </Box>
    </Stack>
  );
};

export default PendingMessageBubble;
