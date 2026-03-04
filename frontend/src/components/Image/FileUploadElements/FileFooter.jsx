import { useState } from "react";
import {
  Box,
  IconButton,
  InputBase,
  Stack,
  useTheme,
} from "@mui/material";
import { PaperPlaneTilt, Plus, XCircle } from "phosphor-react";
import { useSelector, useDispatch } from "react-redux";
import { removeFile, setActiveFileIndex, clearFiles, addPendingMessage, addMessageFromUpload } from "@/redux/slices/chatSlice";
import { UploadFileMessage, uploadAbortControllers } from "@/redux/slices/actions/chatActions";
import { imageSelectHandler } from "@/components/upload/handlers/imageSelectHandler";
import { docSelectHandler } from "@/components/upload/handlers/docSelectHandler";
import { socket } from "@/utils/socket";
import uuidv4 from "@/utils/uuidv4";

const MAX_FILES = 5;

const FileFooter = ({ convo_id }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { files, activeFileIndex } = useSelector((state) => state.chat);
  const [caption, setCaption] = useState("");

  const handleAddMore = () => {
    const firstFileType = files[0]?.actionType;
    if (firstFileType === "image") {
      imageSelectHandler();
    } else {
      docSelectHandler();
    }
  };

  const handleRemoveFile = (fileName) => {
    dispatch(removeFile(fileName));
  };

  const handleSend = () => {
    if (files.length === 0) return;

    const batchId = uuidv4();
    const captionText = caption.trim();
    const isImages = files[0]?.actionType === "image";
    const isSingleDoc = !isImages && files.length === 1;

    // Snapshot files before clearing (objects are Immer-frozen — don't mutate them)
    const filesSnapshot = [...files];

    // Pre-generate a localId for each file
    const localIds = filesSnapshot.map(() => uuidv4());

    const getCaption = (i) =>
      isImages && i === 0
        ? captionText || undefined
        : isSingleDoc
        ? captionText || undefined
        : undefined;

    // 1. Register all pending messages
    filesSnapshot.forEach((fileObj, i) => {
      dispatch(
        addPendingMessage({
          localId: localIds[i],
          batchId,
          batchIndex: i,
          batchTotal: filesSnapshot.length,
          dataUrl: fileObj.dataUrl,
          fileName: fileObj.fileName,
          actionType: fileObj.actionType,
          caption: getCaption(i),
          status: "uploading",
          file: fileObj.file,
          convo_id,
        })
      );
    });

    // 2. Close upload screen immediately
    dispatch(clearFiles());
    setCaption("");

    // 3. Upload each file in parallel
    filesSnapshot.forEach((fileObj, i) => {
      const localId = localIds[i];
      const controller = new AbortController();
      uploadAbortControllers.set(localId, controller);

      const pendingCaption = getCaption(i);

      dispatch(
        UploadFileMessage({
          file: fileObj.file,
          convo_id,
          caption: pendingCaption,
          localId,
          batchId,
          batchIndex: i,
          batchTotal: filesSnapshot.length,
          signal: controller.signal,
        })
      ).then((result) => {
        uploadAbortControllers.delete(localId);
        if (!result.error && result.payload?.message) {
          dispatch(addMessageFromUpload(result.payload.message));
          socket.emit("send_message", result.payload.message);
        }
      });
    });
  };

  return (
    <Stack spacing={1.5} sx={{ px: 2, pb: 2 }}>
      {/* Thumbnail strip */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ overflowX: "auto", py: 0.5 }}
        className="scrollbar"
      >
        {/* Add more button */}
        {files.length < MAX_FILES && (
          <Box
            onClick={handleAddMore}
            sx={{
              width: 60,
              height: 60,
              minWidth: 60,
              borderRadius: 1.5,
              border: `2px dashed ${theme.palette.divider}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              "&:hover": {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Plus size={24} color={theme.palette.text.secondary} />
          </Box>
        )}

        {/* File thumbnails */}
        {files.map((fileObj, index) => (
          <Box
            key={fileObj.fileName}
            sx={{
              position: "relative",
              width: 60,
              height: 60,
              minWidth: 60,
              borderRadius: 1.5,
              overflow: "hidden",
              cursor: "pointer",
              border:
                index === activeFileIndex
                  ? `2px solid ${theme.palette.primary.main}`
                  : `2px solid transparent`,
            }}
            onClick={() => dispatch(setActiveFileIndex(index))}
          >
            {fileObj.actionType === "image" ? (
              <Box
                component="img"
                src={fileObj.dataUrl || URL.createObjectURL(fileObj.file)}
                alt={fileObj.fileName}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: theme.palette.background.default,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                  }}
                >
                  {fileObj.type}
                </Box>
              </Box>
            )}

            {/* Remove button */}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile(fileObj.fileName);
              }}
              sx={{
                position: "absolute",
                top: -2,
                right: -2,
                p: 0,
                backgroundColor: theme.palette.background.paper,
                "&:hover": { backgroundColor: theme.palette.background.paper },
              }}
            >
              <XCircle size={18} weight="fill" color={theme.palette.primary.main} />
            </IconButton>
          </Box>
        ))}
      </Stack>

      {/* Caption input + send button */}
      <Stack direction="row" spacing={1} alignItems="center">
        <InputBase
          placeholder="Add a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          sx={{
            flex: 1,
            px: 2,
            py: 1,
            borderRadius: 20,
            backgroundColor: theme.palette.background.default,
            fontSize: 14,
          }}
        />
        <IconButton
          onClick={handleSend}
          disabled={files.length === 0}
          sx={{
            height: 40,
            width: 40,
            backgroundColor: theme.palette.primary.main,
            borderRadius: 20,
            "&:hover": {
              backgroundColor: theme.palette.primary.dark,
            },
            "&.Mui-disabled": {
              backgroundColor: theme.palette.action.disabledBackground,
            },
          }}
        >
          <PaperPlaneTilt color="#ffffff" size={20} />
        </IconButton>
      </Stack>
    </Stack>
  );
};

export default FileFooter;
