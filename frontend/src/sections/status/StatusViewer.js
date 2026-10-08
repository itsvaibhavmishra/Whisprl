import { useCallback, useEffect, useState } from "react";
import { Box, Button, ButtonBase, Dialog, Drawer, Stack, Typography, useMediaQuery } from "@mui/material";
import { keyframes } from "@mui/system";
import { Eye } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import ReportDialog from "@/components/ReportDialog";
import { GetSentRequests } from "@/redux/slices/actions/contactActions";
import { DeleteStatus, MarkStatusViewed, ReportStatus } from "@/redux/slices/actions/statusActions";
import { GetFriends } from "@/redux/slices/actions/userActions";
import UserProfileDrawer from "@/sections/friend-drawer/UserProfileDrawer";
import ReplyBar, { keepArrows } from "@/sections/status/ReplyBar";
import SeenBy, { seenByLabel } from "@/sections/status/SeenBy";
import ShareStatusDialog from "@/sections/status/ShareStatusDialog";
import StatusHeader from "@/sections/status/StatusHeader";
import StatusMedia from "@/sections/status/StatusMedia";
import { backgroundOf, isLive, textSizeOf } from "@/utils/statuses";

const SHOW_MS = 6000;
const SEEN_BY_WIDTH = 340;

const fill = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const firstUnseenIndex = (statuses) => Math.max(0, statuses.findIndex((status) => status.isViewed === false));

const startIndexOf = (statuses, statusId) => {
  const asked = statuses.findIndex((status) => status._id === statusId);
  return asked === -1 ? firstUnseenIndex(statuses) : asked;
};

const durationOf = ({ content }) => (content.kind === "video" && content.file.duration ? content.file.duration * 1000 : SHOW_MS);

const Segments = ({ count, position, durationMs, isRunning, onDone }) => (
  <Stack direction="row" spacing={0.5} sx={{ px: 1.5, pt: 1.5 }}>
    {[...Array(count).keys()].map((index) => (
      <Box key={index} sx={{ flex: 1, height: 3, borderRadius: 2, overflow: "hidden", bgcolor: "rgba(255, 255, 255, 0.35)" }}>
        <Box
          onAnimationEnd={index === position ? onDone : undefined}
          sx={{
            height: "100%",
            bgcolor: "#fff",
            transformOrigin: "left",
            transform: `scaleX(${index < position ? 1 : 0})`,
            ...(index === position && {
              animation: `${fill} ${durationMs}ms linear forwards`,
              animationPlayState: isRunning ? "running" : "paused",
            }),
          }}
        />
      </Box>
    ))}
  </Stack>
);

const StatusSlide = ({ status, position, count, isOwn, canReply, onNext, onPrevious, onClose }) => {
  const dispatch = useDispatch();
  const isWide = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const [isReady, setIsReady] = useState(status.content.kind === "text");
  const [isListingViewers, setIsListingViewers] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const friends = useSelector((state) => state.user.friends);
  const { friendRequests, sentRequests } = useSelector((state) => state.contact);
  const { owner, content } = status;
  const isPaused = isListingViewers || isTyping || Boolean(profileId) || Boolean(dialog);
  const markReady = useCallback(() => setIsReady(true), []);

  const openProfile = (userId) => {
    dispatch(GetFriends());
    dispatch(GetSentRequests());
    setProfileId(userId);
  };

  const relationTo = (userId) => {
    if (friends.some((friend) => friend._id === userId)) return { isFrom: "Contacts" };
    if (friendRequests.some((request) => request.sender?._id === userId)) return { isFrom: "FriendRequests" };
    return { isFrom: "SearchUsers", isRequestSent: sentRequests.some((sent) => String(sent.receiverId) === userId && sent.isSent) };
  };

  useEffect(() => {
    if (status.isViewed === false) dispatch(MarkStatusViewed(status._id));
  }, [dispatch, status._id, status.isViewed]);

  return (
    <>
      <Box sx={{ position: "relative", height: "100%", width: "100%", maxWidth: 520, display: "flex", flexDirection: "column" }}>
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 3, background: "linear-gradient(rgba(0, 0, 0, 0.55), transparent)" }}>
          <Segments count={count} position={position} durationMs={durationOf(status)} isRunning={isReady && !isPaused} onDone={onNext} />
          <StatusHeader
            status={status}
            isOwn={isOwn}
            onOpenProfile={() => openProfile(owner._id)}
            onShare={() => setDialog("share")}
            onReport={() => setDialog("report")}
            onDelete={() => dispatch(DeleteStatus(status._id))}
            onClose={onClose}
          />
        </Box>

        <Box sx={{ position: "relative", flex: 1, minHeight: 0, display: "grid", placeItems: "center", bgcolor: content.kind === "text" ? backgroundOf(content.background) : "#000" }}>
          {content.kind === "text" ? (
            <Typography sx={{ color: "#fff", px: 4, textAlign: "center", fontWeight: 700, lineHeight: 1.3, fontSize: textSizeOf(content.text), whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
              {content.text}
            </Typography>
          ) : (
            <StatusMedia status={status} isPaused={isPaused} onReady={markReady} onMention={openProfile} />
          )}
          <ButtonBase aria-label="Previous status" onClick={onPrevious} sx={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "30%", zIndex: 1 }} />
          <ButtonBase aria-label="Next status" onClick={onNext} sx={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "70%", zIndex: 1 }} />
        </Box>

        {content.caption && <Typography sx={{ px: 2, pt: 1.5, color: "#fff", textAlign: "center", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{content.caption}</Typography>}
        {!isOwn && <ReplyBar status={status} canReply={canReply} onTyping={setIsTyping} />}
        {isOwn && !isWide && (
          <Button startIcon={<Eye size={18} />} onClick={() => setIsListingViewers(true)} disabled={!status.views.length} sx={{ color: "#fff", my: 1 }}>
            {seenByLabel(status.views)}
          </Button>
        )}

        <Drawer anchor="bottom" open={isListingViewers} onClose={() => setIsListingViewers(false)} onKeyDown={keepArrows} sx={{ zIndex: "modal" }} PaperProps={{ sx: { maxHeight: "70dvh", borderTopLeftRadius: 20, borderTopRightRadius: 20 } }}>
          <SeenBy views={status.views} />
        </Drawer>
        {dialog && (
          <Box onKeyDown={keepArrows}>
            {dialog === "share" ? (
              <ShareStatusDialog status={status} onClose={() => setDialog(null)} />
            ) : (
              <ReportDialog
                subject={`${owner.firstName}'s update`}
                explanation="An update disappears after 24 hours, so tell us here what was wrong with it."
                report={ReportStatus}
                details={{ statusId: status._id }}
                person={owner}
                onClose={() => setDialog(null)}
              />
            )}
          </Box>
        )}
        {profileId && (
          <Box onKeyDown={keepArrows}>
            <UserProfileDrawer openDrawer toggleDrawer={() => setProfileId(null)} selectedUserData={{ _id: profileId }} {...relationTo(profileId)} />
          </Box>
        )}
      </Box>

      {isOwn && isWide && (
        <Box component="aside" aria-label="Who saw this update" sx={{ width: SEEN_BY_WIDTH, flexShrink: 0, height: "100%", color: "#fff", bgcolor: "rgba(255, 255, 255, 0.06)" }}>
          <SeenBy views={status.views} />
        </Box>
      )}
    </>
  );
};

// people play in the order the list had when the viewer opened, so seeing a status does not reshuffle them
const StatusViewer = ({ ownerIds, startOwnerId, startStatusId, onClose }) => {
  const meId = useSelector((state) => state.user.user._id);
  const friendsStatuses = useSelector((state) => state.status.statuses);
  const discover = useSelector((state) => state.status.discover);
  const allStatuses = [...friendsStatuses, ...discover];
  const statusesOf = (ownerId) => allStatuses.filter((status) => status.owner._id === ownerId && isLive(status));

  const [order] = useState(ownerIds);
  const [ownerIndex, setOwnerIndex] = useState(() => order.indexOf(startOwnerId));
  const [position, setPosition] = useState(() => startIndexOf(statusesOf(startOwnerId), startStatusId));
  const statuses = statusesOf(order[ownerIndex]);
  const status = statuses[Math.min(position, statuses.length - 1)];

  useEffect(() => {
    if (!status) onClose();
  }, [status, onClose]);

  if (!status) return null;

  const openOwner = (index) => {
    if (index >= order.length) return onClose();
    setOwnerIndex(index);
    setPosition(firstUnseenIndex(statusesOf(order[index])));
  };

  const next = () => (position < statuses.length - 1 ? setPosition(position + 1) : openOwner(ownerIndex + 1));
  const previous = () => {
    if (position > 0) setPosition(position - 1);
    else if (ownerIndex > 0) openOwner(ownerIndex - 1);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowRight") next();
    if (event.key === "ArrowLeft") previous();
  };

  // the dark around the status stands in for a backdrop, so a click on it closes the viewer
  const closeFromOutside = (event) => event.target === event.currentTarget && onClose();

  return (
    <Dialog
      open
      fullScreen
      onClose={onClose}
      onKeyDown={onKeyDown}
      PaperProps={{ "aria-label": "Status", onClick: closeFromOutside, sx: { bgcolor: "#000", flexDirection: "row", justifyContent: "center" } }}
    >
      <StatusSlide
        key={status._id}
        status={status}
        position={statuses.indexOf(status)}
        count={statuses.length}
        isOwn={status.owner._id === meId}
        canReply={!discover.includes(status)}
        onNext={next}
        onPrevious={previous}
        onClose={onClose}
      />
    </Dialog>
  );
};

export default StatusViewer;
