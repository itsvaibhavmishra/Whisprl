import { useCallback, useEffect, useRef, useState } from "react";
import { Box, ButtonBase, Drawer, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import { useDispatch } from "react-redux";

import ReportDialog from "@/components/ReportDialog";
import { MarkStatusViewed, ReportStatus } from "@/redux/slices/actions/statusActions";
import { GetFriends } from "@/redux/slices/actions/userActions";
import ProfileSheet from "@/components/profile/ProfileSheet";
import DeleteUpdateDialog from "@/sections/status/DeleteUpdateDialog";
import ReplyBar, { FOOTER_HEIGHT, keepKeys } from "@/sections/status/ReplyBar";
import SeenBy, { ViewsPill } from "@/sections/status/SeenBy";
import ShareStatusDialog from "@/sections/status/ShareStatusDialog";
import StatusHeader from "@/sections/status/StatusHeader";
import StatusMedia from "@/sections/status/StatusMedia";
import { backgroundOf, textSizeOf } from "@/utils/statuses";

const SHOW_MS = 6000;
const HOLD_MS = 250;
const PANEL_WIDTH = 340;
const SHEET = "#10141C";
export const CARD_HEIGHT = `min(calc(100dvh - ${FOOTER_HEIGHT + 64}px), 880px)`;
export const CARD_WIDTH = `calc(${CARD_HEIGHT} * 9 / 16)`;

// these wrappers only catch keys from the dialogs portalled out of them, so they must take no room in the row
const KEYS_ONLY = { display: "contents" };

// the next person's card swings in like the far face of a cube, hinged on the edge nearest the one it replaces
const turnIn = (side) => keyframes`
  from { opacity: 0; transform: perspective(1400px) translateX(${side * 72}px) rotateY(${side * -24}deg) scale(0.92); }
  55% { opacity: 1; }
  to { opacity: 1; transform: none; }
`;
const ENTER = { next: { name: turnIn(1), origin: "left center" }, previous: { name: turnIn(-1), origin: "right center" } };

const fill = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const durationOf = ({ content }) => (content.kind === "video" && content.file.duration ? content.file.duration * 1000 : SHOW_MS);

const Segments = ({ count, position, durationMs, isRunning, onDone }) => (
  <Stack direction="row" spacing={0.5} sx={{ px: 1, pt: 1 }}>
    {[...Array(count).keys()].map((index) => (
      <Box key={index} sx={{ flex: 1, height: 2, borderRadius: 1, overflow: "hidden", bgcolor: "rgba(255, 255, 255, 0.3)" }}>
        <Box
          onAnimationEnd={index === position ? onDone : undefined}
          sx={{
            height: "100%",
            bgcolor: "#fff",
            transformOrigin: "left",
            transform: `scaleX(${index < position ? 1 : 0})`,
            ...(index === position && { animation: `${fill} ${durationMs}ms linear forwards`, animationPlayState: isRunning ? "running" : "paused" }),
          }}
        />
      </Box>
    ))}
  </Stack>
);

const StatusSlide = ({ status, position, count, isOwn, canReply, isWide, hasClose, direction, isUserPaused, onUserPause, onNext, onPrevious, onClose }) => {
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(status.content.kind === "text");
  const [isListingViewers, setIsListingViewers] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const holdTimer = useRef(null);
  const viewsPill = useRef(null);
  const wasHeld = useRef(false);
  const { owner, content } = status;
  const isPaused = isUserPaused || isHeld || isListingViewers || isTyping || isPicking || isMoreOpen || Boolean(profileId) || Boolean(dialog);
  const markReady = useCallback(() => setIsReady(true), []);

  const openProfile = (userId) => {
    dispatch(GetFriends());
    setProfileId(userId);
  };

  // holding a finger or the mouse down pauses, and letting go after a hold must not also count as a tap
  const startHold = () => {
    wasHeld.current = false;
    holdTimer.current = setTimeout(() => {
      wasHeld.current = true;
      setIsHeld(true);
    }, HOLD_MS);
  };
  const endHold = () => {
    clearTimeout(holdTimer.current);
    setIsHeld(false);
  };
  const tapTo = (move) => () => {
    if (wasHeld.current) wasHeld.current = false;
    else move();
  };

  // Play means play, so it clears whatever else was holding the update rather than only the pause button's own hold
  const togglePause = () => {
    if (!isPaused) {
      onUserPause(true);
      return;
    }
    setIsListingViewers(false);
    setIsPicking(false);
    onUserPause(false);
  };

  const closeViewers = () => {
    setIsListingViewers(false);
    viewsPill.current?.focus();
  };

  useEffect(() => {
    if (status.isViewed === false) dispatch(MarkStatusViewed(status._id));
  }, [dispatch, status._id, status.isViewed]);

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  return (
    <Stack direction="row" justifyContent="center" spacing={2} sx={{ height: { xs: "100%", md: "auto" }, width: { xs: "100%", md: "auto" } }}>
      <Stack
        justifyContent="center"
        sx={{
          width: { xs: `min(100%, calc((100dvh - ${FOOTER_HEIGHT}px) * 9 / 16))`, md: CARD_WIDTH },
          height: { xs: "100%", md: "auto" },
          ...(direction && { animation: `${ENTER[direction].name} 460ms cubic-bezier(0.22, 1, 0.36, 1)`, transformOrigin: ENTER[direction].origin }),
          "@media (prefers-reduced-motion: reduce)": { animation: "none" },
        }}
      >
        <Box
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          sx={{
            position: "relative",
            overflow: "hidden",
            containerType: "inline-size",
            width: "100%",
            height: { md: CARD_HEIGHT },
            aspectRatio: { xs: "9 / 16", md: "auto" },
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            bgcolor: content.kind === "text" ? backgroundOf(content.background) : "#000",
          }}
        >
          {content.kind === "text" ? (
            <Typography sx={{ color: "#fff", px: 4, textAlign: "center", fontWeight: 700, lineHeight: 1.3, fontSize: textSizeOf(content.text), whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {content.text}
            </Typography>
          ) : (
            <StatusMedia status={status} isPaused={isPaused} onReady={markReady} onMention={openProfile} />
          )}
          <ButtonBase aria-label="Previous status" tabIndex={-1} onClick={tapTo(onPrevious)} disableRipple sx={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "30%", zIndex: 1 }} />
          <ButtonBase aria-label="Next status" tabIndex={-1} onClick={tapTo(onNext)} disableRipple sx={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "70%", zIndex: 1 }} />
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, pb: 5, background: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.35) 60%, transparent)" }}>
            <Segments count={count} position={position} durationMs={durationOf(status)} isRunning={isReady && !isPaused} onDone={onNext} />
            <StatusHeader
              status={status}
              isOwn={isOwn}
              isPaused={isPaused}
              hasClose={hasClose}
              onTogglePause={togglePause}
              onMoreOpen={setIsMoreOpen}
              onOpenProfile={() => openProfile(owner._id)}
              onShare={() => setDialog("share")}
              onReport={() => setDialog("report")}
              onDelete={() => setDialog("delete")}
              onClose={onClose}
            />
          </Box>
          {content.caption && (
            <Typography sx={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 2, px: 2, pt: 4, pb: 2, color: "#fff", textAlign: "center", whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "linear-gradient(transparent, rgba(0, 0, 0, 0.6))" }}>
              {content.caption}
            </Typography>
          )}
        </Box>

        {isOwn ? (
          <Box sx={{ height: FOOTER_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ViewsPill views={status.views} pillRef={viewsPill} onOpen={() => setIsListingViewers(true)} />
          </Box>
        ) : (
          <ReplyBar status={status} canReply={canReply} isPicking={isPicking} onPicking={setIsPicking} onTyping={setIsTyping} />
        )}
      </Stack>

      {isOwn && isWide && isListingViewers && (
        <Box
          component="aside"
          aria-label="Who saw this update"
          onKeyDown={(event) => {
            keepKeys(event);
            if (event.key !== "Escape") return;
            event.stopPropagation();
            closeViewers();
          }}
          sx={{ width: PANEL_WIDTH, height: CARD_HEIGHT, flexShrink: 0, borderRadius: 1.5, overflow: "hidden", bgcolor: SHEET }}
        >
          <SeenBy views={status.views} onClose={closeViewers} />
        </Box>
      )}
      {!isWide && (
        <Drawer
          anchor="bottom"
          open={isListingViewers}
          onClose={() => setIsListingViewers(false)}
          onKeyDown={keepKeys}
          sx={{ zIndex: "modal" }}
          PaperProps={{ "aria-label": "Who saw this update", sx: { maxHeight: "70dvh", borderTopLeftRadius: 20, borderTopRightRadius: 20, bgcolor: SHEET, backgroundImage: "none" } }}
        >
          <SeenBy views={status.views} onClose={closeViewers} />
        </Drawer>
      )}

      {(dialog || profileId) && (
        <Box onKeyDown={keepKeys} sx={KEYS_ONLY}>
          {dialog === "share" && <ShareStatusDialog status={status} onClose={() => setDialog(null)} />}
          {dialog === "delete" && <DeleteUpdateDialog status={status} onClose={() => setDialog(null)} />}
          {dialog === "report" && (
            <ReportDialog
              subject={`${owner.firstName}'s update`}
              explanation="An update disappears after 24 hours, so tell us here what was wrong with it."
              report={ReportStatus}
              details={{ statusId: status._id }}
              person={owner}
              onClose={() => setDialog(null)}
            />
          )}
          {profileId && <ProfileSheet person={profileId === owner._id ? owner : { _id: profileId }} onClose={() => setProfileId(null)} />}
        </Box>
      )}
    </Stack>
  );
};

export default StatusSlide;
