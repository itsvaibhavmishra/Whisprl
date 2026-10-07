import { useEffect, useState } from "react";
import { Box, Button, Dialog, IconButton, InputBase, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { LockSimple, Palette, X } from "phosphor-react";
import { useDispatch } from "react-redux";

import { PostStatus } from "@/redux/slices/actions/statusActions";
import { MAX_STATUS_TEXT, TEXT_BACKGROUNDS, backgroundOf, textSizeOf } from "@/utils/statuses";

const useObjectUrl = (file) => {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const created = URL.createObjectURL(file);
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [file]);
  return url;
};

const MediaPreview = ({ draft }) => {
  const url = useObjectUrl(draft.file);
  if (!url) return null;
  const sx = { display: "block", maxWidth: "100%", maxHeight: "60dvh", mx: "auto" };
  return draft.kind === "video" ? (
    <Box component="video" src={url} controls playsInline sx={sx} />
  ) : (
    <Box component="img" src={url} alt="The photo you chose" sx={sx} />
  );
};

const StatusComposer = ({ draft, onClose }) => {
  const dispatch = useDispatch();
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const [words, setWords] = useState("");
  const [background, setBackground] = useState(0);
  const isText = draft.kind === "text";
  const canShare = !isText || words.trim().length > 0;

  const share = () => {
    const text = words.trim();
    dispatch(PostStatus(isText ? { kind: "text", text, background } : { ...draft, caption: text || undefined }));
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={isPhone}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        "aria-label": isText ? "Write a status" : "Share a photo or video",
        sx: { bgcolor: isText ? backgroundOf(background) : "#000", color: "#fff", transition: "background-color 200ms" },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1 }}>
        <IconButton aria-label="Close" onClick={onClose} sx={{ color: "inherit" }}>
          <X size={22} />
        </IconButton>
        {isText && (
          <Tooltip title="Change colour">
            <IconButton
              aria-label="Change colour"
              onClick={() => setBackground((current) => (current + 1) % TEXT_BACKGROUNDS.length)}
              sx={{ color: "inherit" }}
            >
              <Palette size={22} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Box sx={{ flex: 1, minHeight: isText ? 380 : 0, display: "grid", placeItems: "center", px: isText ? 4 : 0 }}>
        {isText ? (
          <InputBase
            autoFocus
            multiline
            value={words}
            onChange={(event) => setWords(event.target.value)}
            placeholder="Type a status"
            inputProps={{ maxLength: MAX_STATUS_TEXT, "aria-label": "Status text" }}
            sx={{ width: "100%", color: "inherit", fontSize: textSizeOf(words), fontWeight: 700, lineHeight: 1.3, "& textarea": { textAlign: "center" }, "& textarea::placeholder": { color: "inherit", opacity: 0.7 } }}
          />
        ) : (
          <MediaPreview draft={draft} />
        )}
      </Box>

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2 }}>
        {isText ? (
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flex: 1, opacity: 0.8 }}>
            <LockSimple size={14} aria-hidden />
            <Typography variant="caption">Your friends can see it for 24 hours. End-to-end encrypted.</Typography>
          </Stack>
        ) : (
          <InputBase
            value={words}
            onChange={(event) => setWords(event.target.value)}
            placeholder="Add a caption"
            inputProps={{ maxLength: MAX_STATUS_TEXT, "aria-label": "Caption" }}
            sx={{ flex: 1, color: "inherit", px: 2, py: 1, borderRadius: 99, bgcolor: "rgba(255, 255, 255, 0.12)", "& input::placeholder": { color: "inherit", opacity: 0.7 } }}
          />
        )}
        <Button variant="contained" onClick={share} disabled={!canShare}>
          Share
        </Button>
      </Stack>
    </Dialog>
  );
};

export default StatusComposer;
