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
import { setActiveFileIndex } from "@/redux/slices/chatSlice";
import { ChooseAttachments, RemoveAttachment, SendAttachments } from "@/redux/slices/actions/attachmentActions";
import { MAX_ATTACHMENTS, attachmentPreview } from "@/utils/attachments";

const FileFooter = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { files, activeFileIndex } = useSelector((state) => state.chat);
  const [caption, setCaption] = useState("");

  const handleSend = () => {
    dispatch(SendAttachments(caption.trim() || undefined));
    setCaption("");
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
        {files.length < MAX_ATTACHMENTS && (
          <Box
            onClick={() => dispatch(ChooseAttachments(files[0]?.kind))}
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
            key={fileObj.id}
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
            {fileObj.kind === "image" ? (
              <Box
                component="img"
                src={attachmentPreview(fileObj.id)}
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
                  {fileObj.typeLabel}
                </Box>
              </Box>
            )}

            {/* Remove button */}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(RemoveAttachment(fileObj.id));
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
