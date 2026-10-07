import { useRef, useState } from "react";
import { Box, ButtonBase, IconButton, Modal, Stack, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { AnimatePresence, m, useMotionValue, useTransform } from "framer-motion";
import { CaretLeft, CaretRight, X } from "phosphor-react";
import { flushSync } from "react-dom";
import { useDispatch, useSelector } from "react-redux";

import useMessageTime from "@/hooks/useMessageTime";
import { focusMessage } from "@/redux/slices/chatSlice";
import MessageText from "@/sections/chat/messages/MessageText";
import Filmstrip from "@/sections/chat/viewer/Filmstrip";
import { mediaKeyOf } from "@/sections/chat/viewer/mediaItems";
import useFlight from "@/sections/chat/viewer/useFlight";
import ViewerActions from "@/sections/chat/viewer/ViewerActions";
import ViewerSlide from "@/sections/chat/viewer/ViewerSlide";
import { VIEWER_BUTTON, frostedRoom } from "@/sections/chat/viewer/viewerTheme";
import getAvatar from "@/utils/avatars";

const TITLE_ID = "media-viewer-title";

const fadeOver = (distance) => ([drag, openness]) => openness * Math.max(0, 1 - Math.max(drag, 0) / distance);

// drawn over the page but mounted inside a message, so its taps and keys must not reach the bubble's long press, swipe or details
const keepInside = (event) => event.stopPropagation();

const chromeStyle = (isShown) => ({ transition: "opacity 200ms ease", opacity: isShown ? 1 : 0, pointerEvents: isShown ? "auto" : "none" });

const StepButton = ({ side, onClick }) => (
  <IconButton
    aria-label={side === "left" ? "Previous" : "Next"}
    onClick={onClick}
    sx={{ ...VIEWER_BUTTON, position: "absolute", top: "50%", [side]: 24, zIndex: 2, width: 52, height: 52, transform: "translateY(-50%)" }}
  >
    {side === "left" ? <CaretLeft size={24} weight="bold" /> : <CaretRight size={24} weight="bold" />}
  </IconButton>
);

// tileOf finds the tile a photo shows in, so the viewer can open out of it and close back into it
const MediaViewer = ({ items, startIndex = 0, conversation, tileOf, onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isWide = useMediaQuery(theme.breakpoints.up("md"));
  const meId = useSelector((state) => state.user.user._id);
  const messageTime = useMessageTime();
  const [shownKey, setShownKey] = useState(() => mediaKeyOf(items[startIndex]));
  const [direction, setDirection] = useState(0);
  const [isChromeHidden, setIsChromeHidden] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [openedFrom] = useState(() => tileOf?.(startIndex)?.getBoundingClientRect());
  const isClosing = useRef(false);
  const lastIndex = useRef(startIndex);
  const dragY = useMotionValue(0);
  const flight = useFlight(dragY, openedFrom);
  const roomFade = useTransform([dragY, flight.openness], fadeOver(360));
  const chromeFade = useTransform([dragY, flight.openness], fadeOver(80));

  // a photo deleted while open hands over to the one beside it
  const foundIndex = items.findIndex((item) => mediaKeyOf(item) === shownKey);
  const index = foundIndex >= 0 ? foundIndex : Math.min(lastIndex.current, items.length - 1);
  lastIndex.current = index;
  const item = items[index];
  const { message } = item;
  const isMine = message.sender?._id === meId;
  const senderName = isMine ? "You" : `${message.sender?.firstName ?? ""} ${message.sender?.lastName ?? ""}`.trim();
  const isChromeShown = !isChromeHidden && !isZoomed;

  // gone at once on landing, so focus has gone back to the photo before anything chained after closing moves it on
  const close = () => {
    if (isClosing.current) return Promise.resolve();
    isClosing.current = true;
    return flight.land(tileOf?.(index)?.getBoundingClientRect()).then(() => flushSync(onClose));
  };

  const showInChat = () => close().then(() => dispatch(focusMessage(message._id)));

  const step = (offset) => {
    const next = items[index + offset];
    if (!offset || !next) return false;
    setDirection(Math.sign(offset));
    setShownKey(mediaKeyOf(next));
    setIsZoomed(false);
    return true;
  };

  const handleKeys = (event) => {
    keepInside(event);
    // a dialog opened from here is its own layer, so arrow keys pressed in it stay there
    if (isZoomed || !event.currentTarget.contains(event.target)) return;
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  };

  const actions = <ViewerActions item={item} onClose={close} />;

  return (
    <Modal
      open
      onClose={close}
      hideBackdrop
      onKeyDown={handleKeys}
      onClick={keepInside}
      onContextMenu={keepInside}
      onTouchStart={keepInside}
      onTouchMove={keepInside}
      onTouchEnd={keepInside}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        // clip rather than hidden, so a photo sliding in past the edge never lets anything scroll the viewer aside
        sx={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", color: "#fff", overflow: "clip", outline: "none" }}
      >
        <Box component={m.div} style={{ opacity: roomFade }} sx={[{ position: "absolute", inset: 0 }, frostedRoom]} />

        <Box component={m.div} style={{ opacity: chromeFade }} sx={{ position: "relative", zIndex: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ ...chromeStyle(isChromeShown), position: "relative", px: { xs: 1, md: 2.5 }, pt: "max(10px, env(safe-area-inset-top))", pb: 1 }}
          >
            <Tooltip title="Show in chat">
              <ButtonBase
                onClick={showInChat}
                sx={{ flex: "0 1 auto", minWidth: 0, gap: 1.5, p: 0.75, pr: 1.5, borderRadius: 99, textAlign: "left", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" } }}
              >
                {getAvatar(message.sender?.avatar, message.sender?.firstName, 40)}
                <Box sx={{ minWidth: 0 }}>
                  <Typography id={TITLE_ID} component="h2" noWrap sx={{ fontSize: 15, fontWeight: 700 }}>
                    {senderName}
                  </Typography>
                  <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 500, color: "rgba(255, 255, 255, 0.62)" }}>
                    {messageTime(message.createdAt)}
                  </Typography>
                </Box>
              </ButtonBase>
            </Tooltip>
            <Box sx={{ flex: 1 }} />
            {items.length > 1 && (
              <Typography
                aria-live="polite"
                sx={{
                  flexShrink: 0,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 99,
                  fontSize: 13,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  bgcolor: "rgba(255, 255, 255, 0.08)",
                  ...(isWide && { position: "absolute", left: "50%", transform: "translateX(-50%)" }),
                }}
              >
                {index + 1} of {items.length}
              </Typography>
            )}
            {isWide && actions}
            <IconButton aria-label="Close" onClick={close} sx={VIEWER_BUTTON}>
              <X size={22} weight="bold" />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ position: "relative", flex: 1, minHeight: 0 }}>
          <AnimatePresence custom={direction} initial={false}>
            <ViewerSlide
              key={mediaKeyOf(item)}
              item={item}
              direction={direction}
              conversation={conversation}
              dragY={dragY}
              frameRef={flight.holdFrame}
              frameStyle={flight.frameStyle}
              onStep={step}
              onZoom={setIsZoomed}
              onClose={close}
              onToggleChrome={() => setIsChromeHidden((isHidden) => !isHidden)}
            />
          </AnimatePresence>
          {isWide && !isZoomed && index > 0 && <StepButton side="left" onClick={() => step(-1)} />}
          {isWide && !isZoomed && index < items.length - 1 && <StepButton side="right" onClick={() => step(1)} />}
        </Box>

        <Box component={m.div} style={{ opacity: chromeFade }} sx={{ position: "relative", zIndex: 2 }}>
          <Stack alignItems="center" spacing={1.5} sx={{ ...chromeStyle(isChromeShown), px: 2, pt: 1.5, pb: "max(16px, env(safe-area-inset-bottom))" }}>
            {message.message && (
              <MessageText
                text={message.message}
                variant="body1"
                sx={{ maxWidth: 640, maxHeight: "18vh", overflowY: "auto", textAlign: "center", fontWeight: 500, lineHeight: 1.5, color: "rgba(255, 255, 255, 0.92)" }}
              />
            )}
            {!isWide && actions}
            {items.length > 1 && <Filmstrip items={items} index={index} onPick={(nextIndex) => step(nextIndex - index)} />}
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
};

export default MediaViewer;
