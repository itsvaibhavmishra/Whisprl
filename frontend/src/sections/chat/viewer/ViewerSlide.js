import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { animate, m, useDragControls, useMotionValue, useTransform } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";

import { ReactToMessage } from "@/redux/slices/actions/messageActions";
import MessageImage from "@/sections/chat/messages/MessageImage";
import Reactions from "@/sections/chat/messages/Reactions";
import { TransferOverlay, useTransfer } from "@/sections/chat/messages/TransferRing";
import { VideoPlayer } from "@/sections/chat/messages/VideoMessage";
import { VIEWER_ROOM } from "@/sections/chat/viewer/viewerTheme";
import { myReactionOn } from "@/utils/reactions";

const ZOOM = 2.5;
const DOUBLE_TAP_MS = 300;
const TAP_SLOP = 8;
const SWIPE_DISTANCE = 80;
const SWIPE_SPEED = 500;
const DISMISS_DISTANCE = 120;
const SETTLE = { type: "spring", stiffness: 420, damping: 38 };

const SLIDE = {
  enter: (direction) => ({ x: `${direction * 24}%`, opacity: direction ? 0 : 1 }),
  center: { x: "0%", opacity: 1 },
  exit: (direction) => ({ x: `${direction * -24}%`, opacity: 0 }),
};

const SLIDE_TIMING = { x: SETTLE, opacity: { duration: 0.2 } };

const ON_DARK = { bgcolor: "#1C212B", borderColor: VIEWER_ROOM, color: "rgba(255, 255, 255, 0.72)" };

// the browser's own dragging of an image would swallow the swipe
const stopImageDrag = (event) => event.preventDefault();

const clamp = (value, limit) => Math.min(limit, Math.max(-limit, value));

const stepOf = (offset, velocity) => {
  if (offset < -SWIPE_DISTANCE || velocity < -SWIPE_SPEED) return 1;
  if (offset > SWIPE_DISTANCE || velocity > SWIPE_SPEED) return -1;
  return 0;
};

// a set box rather than the whole screen, so a photo shows whole at a size that stays easy to take in
const VIEW_BOX = { width: 960, height: 720 };

// a file sent before encryption has no size on file, so a photo waits in a square until it loads and shows its own
const UNKNOWN_SIZE = { image: { width: 320, height: 320 }, video: { width: 960, height: 540 } };

// sized to the photo's own shape and never past its own pixels, so a tap or a zoom lands on the photo itself
const frameOf = ({ width, height }) => ({
  aspectRatio: `${width} / ${height}`,
  width: `min(${VIEW_BOX.width}px, 100cqw, min(${VIEW_BOX.height}px, 100cqh) * ${width / height}, ${width}px)`,
});

const ViewerSlide = ({ item, direction, conversation, dragY, frameRef, frameStyle, onStep, onZoom, onClose, onToggleChrome }) => {
  const { file, message } = item;
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const isVideo = file.fileType === "video";
  const transfer = useTransfer([file]);
  const swipeX = useMotionValue(0);
  const swipe = useDragControls();
  const pressedAt = useRef(null);
  const shrink = useTransform(dragY, [0, 400], [1, 0.8]);
  const slide = useRef(null);
  const photo = useRef(null);
  const lastTap = useRef(0);
  const chromeTimer = useRef(null);
  const [zoom, setZoom] = useState(null);
  const [loadedSize, setLoadedSize] = useState(null);
  const size = file.width && file.height ? file : loadedSize ?? UNKNOWN_SIZE[file.fileType];

  useEffect(() => () => clearTimeout(chromeTimer.current), []);

  const react = (emoji) => dispatch(ReactToMessage({ message, emoji }));

  const zoomTo = (nextZoom) => {
    setZoom(nextZoom);
    onZoom(Boolean(nextZoom));
  };

  // the point tapped stays under the finger, and panning stops where the photo's edge meets the screen's
  const toggleZoom = ({ clientX, clientY }) => {
    if (zoom) {
      zoomTo(null);
      return;
    }
    const box = photo.current.getBoundingClientRect();
    const stage = slide.current.getBoundingClientRect();
    const reach = { x: Math.max(0, (box.width * ZOOM - stage.width) / 2), y: Math.max(0, (box.height * ZOOM - stage.height) / 2) };
    zoomTo({
      reach,
      x: clamp((box.left + box.width / 2 - clientX) * (ZOOM - 1), reach.x),
      y: clamp((box.top + box.height / 2 - clientY) * (ZOOM - 1), reach.y),
    });
  };

  // a finger needs a double tap to zoom, since one tap shows or hides the controls
  const tap = (event, { point }) => {
    const pressed = pressedAt.current;
    pressedAt.current = null;
    // the end of a swipe or a pan arrives as a tap too, so only a press on the slide that stayed put counts
    if (!pressed || Math.hypot(point.x - pressed.x, point.y - pressed.y) > TAP_SLOP || event.target.closest("button")) return;
    if (event.pointerType !== "touch") {
      if (!photo.current.contains(event.target)) onClose();
      else if (!isVideo) toggleZoom(event);
      return;
    }
    if (event.timeStamp - lastTap.current < DOUBLE_TAP_MS) {
      clearTimeout(chromeTimer.current);
      lastTap.current = 0;
      if (!isVideo) toggleZoom(event);
      return;
    }
    lastTap.current = event.timeStamp;
    chromeTimer.current = setTimeout(onToggleChrome, DOUBLE_TAP_MS);
  };

  // the reaction sheet is a layer of its own, so presses in it never drag the photo
  const press = (event) => {
    if (!event.currentTarget.contains(event.target)) return;
    pressedAt.current = { x: event.pageX, y: event.pageY };
    // a video's own controls take presses that start on it, so a swipe begins anywhere else
    if (!zoom && !event.target.closest("video")) swipe.start(event);
  };

  const release = (_, { offset, velocity }) => {
    const isSideways = Math.abs(offset.x) > Math.abs(offset.y);
    if (isSideways && onStep(stepOf(offset.x, velocity.x))) return;
    if (!isSideways && (offset.y > DISMISS_DISTANCE || velocity.y > SWIPE_SPEED)) {
      onClose();
      return;
    }
    animate(swipeX, 0, SETTLE);
    animate(dragY, 0, SETTLE);
  };

  return (
    <Box
      component={m.div}
      ref={slide}
      custom={direction}
      variants={SLIDE}
      initial="enter"
      animate="center"
      exit="exit"
      transition={SLIDE_TIMING}
      drag={!zoom}
      dragControls={swipe}
      dragListener={false}
      dragDirectionLock
      dragMomentum={false}
      onDragEnd={release}
      onPointerDown={press}
      onTap={tap}
      // framer makes anything with onTap a tab stop, and the slide is not a control
      tabIndex={-1}
      onDragStartCapture={stopImageDrag}
      style={{ x: swipeX, y: dragY, scale: shrink }}
      sx={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        px: { xs: 0, md: 11 },
        pt: 1,
        pb: 3.5,
        containerType: "size",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <Box component={m.div} ref={frameRef} style={frameStyle} sx={{ position: "relative", ...frameOf(size) }}>
        <Box
          component={m.div}
          ref={photo}
          animate={zoom ? { scale: ZOOM, x: zoom.x, y: zoom.y } : { scale: 1, x: 0, y: 0 }}
          transition={SETTLE}
          drag={Boolean(zoom)}
          dragConstraints={zoom && { left: -zoom.reach.x, right: zoom.reach.x, top: -zoom.reach.y, bottom: zoom.reach.y }}
          dragElastic={0.12}
          sx={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius: { xs: 0, sm: "14px" },
            boxShadow: "0 24px 80px -12px rgba(0, 0, 0, 0.7)",
            ...(!isVideo && { cursor: zoom ? "grab" : "zoom-in" }),
            ...(zoom && { "&:active": { cursor: "grabbing" } }),
          }}
        >
          {isVideo ? (
            <VideoPlayer file={file} sx={{ width: "100%", height: "100%" }} />
          ) : (
            <MessageImage
              file={file}
              fit="contain"
              onPhotoLoad={({ currentTarget }) => setLoadedSize({ width: currentTarget.naturalWidth, height: currentTarget.naturalHeight })}
            />
          )}
        </Box>
        {transfer && <TransferOverlay transfer={transfer} />}
        {!zoom && (
          <Reactions
            reactions={message.reactions ?? []}
            conversation={conversation}
            mine={myReactionOn(message, meId)}
            inset={14}
            onReact={react}
            onRemove={({ emoji }) => react(emoji)}
            sx={ON_DARK}
          />
        )}
      </Box>
    </Box>
  );
};

export default ViewerSlide;
