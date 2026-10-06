import { useEffect, useState } from "react";
import { Box, CircularProgress, Dialog, IconButton, Stack, Typography } from "@mui/material";
import { X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { MarkViewOnceOpened } from "@/redux/slices/actions/messageActions";
import { openViewOnceFile } from "@/utils/attachments";
import { filesOf } from "@/utils/messageFiles";

const MEDIA_MAX_HEIGHT = "calc(100dvh - 110px)";

// the viewer's own username across the photo or video, so a copy of the screen says whose screen it was
const watermarkOf = (mark) => {
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="150"><text x="20" y="90" transform="rotate(-30 130 75)" fill="white" fill-opacity="0.16" font-family="Manrope, sans-serif" font-weight="700" font-size="22">${mark}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(tile)}")`;
};

const drawPhoto = (canvas, bitmap) => {
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0);
};

// nothing is kept: shown once, hidden whenever the page loses focus, and wiped on close
const ViewOnceViewer = ({ message, onClose }) => {
  const dispatch = useDispatch();
  const username = useSelector((state) => state.user.user.username);
  // the dialog mounts its content after this component, so the canvas arrives through a callback ref
  const [canvas, setCanvas] = useState(null);
  // held from the moment it opens, since marking it opened deletes the file the message points to
  const [sealed] = useState(() => filesOf(message)[0].sealed);
  const [videoUrl, setVideoUrl] = useState(null);
  const [status, setStatus] = useState("opening");
  const [isHidden, setIsHidden] = useState(false);
  const messageId = message._id;
  const isVideo = message.file?.kind === "video";

  useEffect(() => {
    if (!isVideo && !canvas) return;
    let isCurrent = true;
    let ownUrl = null;
    openViewOnceFile(sealed)
      .then(async (blob) => {
        if (!isCurrent) return;
        if (isVideo) {
          ownUrl = URL.createObjectURL(blob);
          setVideoUrl(ownUrl);
        } else {
          const bitmap = await createImageBitmap(blob);
          if (!isCurrent) return bitmap.close();
          drawPhoto(canvas, bitmap);
          bitmap.close();
        }
        setStatus("open");
        dispatch(MarkViewOnceOpened(messageId));
      })
      .catch(() => isCurrent && setStatus("failed"));
    return () => {
      isCurrent = false;
      if (canvas) canvas.width = 0;
      if (ownUrl) URL.revokeObjectURL(ownUrl);
    };
  }, [isVideo, canvas, sealed, messageId, dispatch]);

  useEffect(() => {
    const hide = () => setIsHidden(true);
    const showIfFocused = () => setIsHidden(document.visibilityState !== "visible" || !document.hasFocus());
    window.addEventListener("blur", hide);
    window.addEventListener("focus", showIfFocused);
    document.addEventListener("visibilitychange", showIfFocused);
    return () => {
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", showIfFocused);
      document.removeEventListener("visibilitychange", showIfFocused);
    };
  }, []);

  return (
    <Dialog
      open
      fullScreen
      onClose={onClose}
      aria-labelledby="view-once-title"
      onContextMenu={(event) => event.preventDefault()}
      PaperProps={{ sx: { bgcolor: "#000", userSelect: "none", "@media print": { display: "none" } } }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5, color: "#fff" }}>
        <Typography id="view-once-title" variant="body2" sx={{ opacity: 0.8 }}>
          View once {isVideo ? "video" : "photo"}. It can't be opened again after you close it.
        </Typography>
        <IconButton aria-label="Close" onClick={onClose} sx={{ color: "#fff" }}>
          <X size={22} />
        </IconButton>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", p: 2 }}>
        {status === "opening" && <CircularProgress aria-label="Opening" sx={{ color: "#fff" }} />}
        {status === "failed" && <Typography sx={{ color: "#fff" }}>This {isVideo ? "video" : "photo"} could not be opened.</Typography>}
        <Box
          sx={{
            position: "relative",
            display: status === "open" ? "inline-flex" : "none",
            maxWidth: "100%",
            filter: isHidden ? "blur(40px)" : "none",
            transition: "filter 120ms",
          }}
        >
          {isVideo ? (
            videoUrl && (
              <Box
                component="video"
                src={videoUrl}
                autoPlay
                controls
                playsInline
                disablePictureInPicture
                controlsList="nodownload noplaybackrate noremoteplayback"
                aria-label="The video"
                sx={{ display: "block", maxWidth: "100%", maxHeight: MEDIA_MAX_HEIGHT }}
              />
            )
          ) : (
            <Box
              component="canvas"
              ref={setCanvas}
              role="img"
              aria-label="The photo"
              draggable={false}
              sx={{ display: "block", maxWidth: "100%", maxHeight: MEDIA_MAX_HEIGHT }}
            />
          )}
          <Box aria-hidden sx={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: watermarkOf(`@${username}`) }} />
        </Box>
      </Box>
    </Dialog>
  );
};

export default ViewOnceViewer;
