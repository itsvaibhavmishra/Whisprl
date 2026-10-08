import { useCallback, useEffect, useState } from "react";
import { Box, Button, ButtonBase, Dialog, Drawer, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import { keyframes } from "@mui/system";
import { Eye, Trash, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import useMessageTime from "@/hooks/useMessageTime";
import { GetSentRequests } from "@/redux/slices/actions/contactActions";
import { DeleteStatus, MarkStatusViewed } from "@/redux/slices/actions/statusActions";
import { GetFriends } from "@/redux/slices/actions/userActions";
import UserProfileDrawer from "@/sections/friend-drawer/UserProfileDrawer";
import ReplyBar, { keepArrows } from "@/sections/status/ReplyBar";
import SeenBy, { seenByLabel } from "@/sections/status/SeenBy";
import StatusMedia from "@/sections/status/StatusMedia";
import getAvatar from "@/utils/avatars";
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

const StatusSlide = ({ status, position, count, isOwn, onNext, onPrevious, onClose }) => {
  const dispatch = useDispatch();
  const messageTime = useMessageTime();
  const isWide = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const [isReady, setIsReady] = useState(status.content.kind === "text");
  const [isListingViewers, setIsListingViewers] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const friends = useSelector((state) => state.user.friends);
  const { friendRequests, sentRequests } = useSelector((state) => state.contact);
  const { owner, content } = status;
  const isPaused = isListingViewers || isTyping || Boolean(profileId);
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
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1.5, py: 1, color: "#fff" }}>
            {getAvatar(owner.avatar, owner.firstName, 36)}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {isOwn ? "My status" : `${owner.firstName} ${owner.lastName}`}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {messageTime(status.createdAt)}
              </Typography>
            </Box>
            {isOwn && (
              <IconButton aria-label="Delete status" onClick={() => dispatch(DeleteStatus(status._id))} sx={{ color: "inherit" }}>
                <Trash size={22} />
              </IconButton>
            )}
            <IconButton aria-label="Close" onClick={onClose} sx={{ color: "inherit" }}>
              <X size={22} />
            </IconButton>
          </Stack>
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
        {!isOwn && <ReplyBar status={status} onTyping={setIsTyping} />}
        {isOwn && !isWide && (
          <Button startIcon={<Eye size={18} />} onClick={() => setIsListingViewers(true)} disabled={!status.views.length} sx={{ color: "#fff", my: 1 }}>
            {seenByLabel(status.views)}
          </Button>
        )}

        <Drawer anchor="bottom" open={isListingViewers} onClose={() => setIsListingViewers(false)} onKeyDown={keepArrows} sx={{ zIndex: "modal" }} PaperProps={{ sx: { maxHeight: "70dvh", borderTopLeftRadius: 20, borderTopRightRadius: 20 } }}>
          <SeenBy views={status.views} />
        </Drawer>
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
  const allStatuses = useSelector((state) => state.status.statuses);
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
        onNext={next}
        onPrevious={previous}
        onClose={onClose}
      />
    </Dialog>
  );
};

export default StatusViewer;
