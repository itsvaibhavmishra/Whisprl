import { useEffect, useState } from "react";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { File as FileIcon, PencilSimple } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import MediaEditor from "@/components/media-editor/MediaEditor";
import Stage from "@/components/media-editor/Stage";
import useFittedSize from "@/hooks/useFittedSize";
import { EditAttachment } from "@/redux/slices/actions/attachmentActions";
import { attachmentUrl, originalFileOf } from "@/utils/attachments";
import { gradientOf } from "@/utils/gradients";
import { NO_EDITS, hasEdits, isGif } from "@/utils/media-editor/render";
import { canDrawOnVideos } from "@/utils/video";

const PREVIEW = { maxWidth: "100%", maxHeight: "100%", borderRadius: 2.5, boxShadow: (theme) => `0 24px 48px -16px ${theme.palette.chat.shade}` };

const mediaOf = (file) => ({ kind: file.kind, file: originalFileOf(file.id), width: file.width, height: file.height });

// a video's drawing is only added while it compresses for sending, so until then it shows over the video
const EditedVideo = ({ file }) => {
  const [ref, size] = useFittedSize(file.width / file.height);
  return (
    <Box ref={ref} sx={{ flex: 1, alignSelf: "stretch", minWidth: 0, display: "grid", placeItems: "center" }}>
      {size && <Stage media={mediaOf(file)} edits={file.edits} size={size} isMuted={false} isReadOnly />}
    </Box>
  );
};

const FileBody = () => {
  const dispatch = useDispatch();
  const { files, activeFileIndex } = useSelector((state) => state.chat);
  const [isEditing, setIsEditing] = useState(false);
  const [canDrawOnVideo, setCanDrawOnVideo] = useState(false);

  const activeFile = files[activeFileIndex];
  const activeKind = activeFile?.kind;

  useEffect(() => {
    if (activeKind === "video") canDrawOnVideos().then(setCanDrawOnVideo, () => {});
  }, [activeKind]);

  if (!activeFile) return null;

  const media = mediaOf(activeFile);
  const isEditable = activeFile.width > 0 && (activeKind === "video" ? canDrawOnVideo : activeKind === "image" && !isGif(media));
  const edits = activeFile.edits ?? NO_EDITS;

  // the editor stays up until the photo is redrawn, so Send can never go out with the photo from before
  const finishEditing = async (edited) => {
    if (edited !== edits) await dispatch(EditAttachment(activeFile.id, edited));
    setIsEditing(false);
  };

  const preview = () => {
    if (activeFile.kind === "video" && hasEdits(activeFile.edits)) return <EditedVideo file={activeFile} />;
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

  return (
    <Box sx={{ position: "relative", flex: 1, minHeight: 0, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", p: 2 }}>
      {preview()}
      {isEditable && (
        <Tooltip title="Add text, stickers or drawing">
          <IconButton
            aria-label={activeFile.kind === "video" ? "Edit video" : "Edit photo"}
            onClick={() => setIsEditing(true)}
            sx={{ position: "absolute", top: 24, right: 24, color: "common.white", bgcolor: "rgba(6, 12, 22, 0.6)", "&:hover": { bgcolor: "rgba(6, 12, 22, 0.8)" } }}
          >
            <PencilSimple size={20} weight="bold" />
          </IconButton>
        </Tooltip>
      )}
      {isEditing && (
        <MediaEditor
          media={media}
          initialEdits={edits}
          label={activeFile.kind === "video" ? "Edit video" : "Edit photo"}
          doneLabel="Done"
          onDone={finishEditing}
          onClose={() => setIsEditing(false)}
        />
      )}
    </Box>
  );
};

export default FileBody;
