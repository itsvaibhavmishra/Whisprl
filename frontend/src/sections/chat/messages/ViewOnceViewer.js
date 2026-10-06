import { useEffect, useState } from "react";
import { Box, CircularProgress, Dialog, IconButton, Stack, Typography } from "@mui/material";
import { X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { MarkViewOnceOpened } from "@/redux/slices/actions/messageActions";
import { openViewOnceFile } from "@/utils/attachments";
import { filesOf } from "@/utils/messageFiles";

const WATERMARK_ALPHA = 0.16;

// the viewer's own username across the photo, so a copy of the screen says whose screen it was
const drawWithWatermark = (canvas, bitmap, mark) => {
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  context.drawImage(bitmap, 0, 0);

  const fontSize = Math.max(16, Math.round(Math.min(canvas.width, canvas.height) / 18));
  const reach = Math.hypot(canvas.width, canvas.height);
  context.globalAlpha = WATERMARK_ALPHA;
  context.fillStyle = "#fff";
  context.font = `700 ${fontSize}px Manrope, sans-serif`;
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(-Math.PI / 6);
  for (let row = -reach; row < reach; row += fontSize * 4) {
    for (let column = -reach; column < reach; column += fontSize * 9) context.fillText(mark, column, row);
  }
};

// nothing is kept: the photo is drawn once, hidden whenever the page loses focus, and wiped on close
const ViewOnceViewer = ({ message, onClose }) => {
  const dispatch = useDispatch();
  const username = useSelector((state) => state.user.user.username);
  // the dialog mounts its content after this component, so the canvas arrives through a callback ref
  const [canvas, setCanvas] = useState(null);
  // held from the moment it opens, since marking it opened deletes the file the message points to
  const [sealed] = useState(() => filesOf(message)[0].sealed);
  const [status, setStatus] = useState("opening");
  const [isHidden, setIsHidden] = useState(false);
  const messageId = message._id;

  useEffect(() => {
    if (!canvas) return;
    let isCurrent = true;
    openViewOnceFile(sealed)
      .then((blob) => createImageBitmap(blob))
      .then((bitmap) => {
        if (!isCurrent) return bitmap.close();
        drawWithWatermark(canvas, bitmap, `@${username}`);
        bitmap.close();
        setStatus("open");
        dispatch(MarkViewOnceOpened(messageId));
      })
      .catch(() => isCurrent && setStatus("failed"));
    return () => {
      isCurrent = false;
      canvas.width = 0;
    };
  }, [canvas, sealed, messageId, username, dispatch]);

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
          View once photo. It can't be opened again after you close it.
        </Typography>
        <IconButton aria-label="Close" onClick={onClose} sx={{ color: "#fff" }}>
          <X size={22} />
        </IconButton>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, display: "grid", placeItems: "center", p: 2 }}>
        {status === "opening" && <CircularProgress aria-label="Opening photo" sx={{ color: "#fff" }} />}
        {status === "failed" && <Typography sx={{ color: "#fff" }}>This photo could not be opened.</Typography>}
        <Box
          component="canvas"
          ref={setCanvas}
          role="img"
          aria-label="The photo"
          draggable={false}
          sx={{
            display: status === "open" ? "block" : "none",
            maxWidth: "100%",
            maxHeight: "100%",
            filter: isHidden ? "blur(40px)" : "none",
            transition: "filter 120ms",
          }}
        />
      </Box>
    </Dialog>
  );
};

export default ViewOnceViewer;
