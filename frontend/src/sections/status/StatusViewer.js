import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { keyframes } from "@mui/system";
import { Eye, Trash, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import useFileUrl from "@/hooks/useFileUrl";
import { DeleteStatus, MarkStatusViewed } from "@/redux/slices/actions/statusActions";
import { GetSentRequests } from "@/redux/slices/actions/contactActions";
import { GetFriends } from "@/redux/slices/actions/userActions";
import useMessageTime from "@/hooks/useMessageTime";
import UserProfileDrawer from "@/sections/friend-drawer/UserProfileDrawer";
import getAvatar from "@/utils/avatars";
import { backgroundOf, isLive, textSizeOf } from "@/utils/statuses";

const SHOW_MS = 6000;

const fill = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const firstUnseenIndex = (statuses) => Math.max(0, statuses.findIndex((status) => status.isViewed === false));

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

// a photo or video is downloaded and decrypted before its time starts running
const StatusMedia = ({ status, isPaused, onReady, onMention }) => {
  const video = useRef(null);
  const { file, mentions = [] } = status.content;
  const alt = status.content.alt || status.content.caption;
  const { url, failed } = useFileUrl({ sealed: { ...file, url: status.file.url } });

  useEffect(() => {
    if (failed) onReady();
  }, [failed, onReady]);

  useEffect(() => {
    if (!video.current) return;
    if (isPaused) video.current.pause();
    else video.current.play().catch(() => {});
  }, [isPaused]);

  if (failed) return <Typography sx={{ color: "#fff" }}>This status could not be opened</Typography>;

  const sx = { width: "100%", height: "100%", objectFit: "contain", display: "block" };
  const shape = file.width && file.height ? { width: `min(100cqw, 100cqh * ${file.width / file.height})`, aspectRatio: `${file.width} / ${file.height}` } : { width: "100%", height: "100%" };
  // above the previous and next areas so a mention can be tapped, and see-through to taps everywhere else
  return (
    <Box sx={{ position: "relative", zIndex: 2, pointerEvents: "none", width: "100%", height: "100%", display: "grid", placeItems: "center", containerType: "size" }}>
      {!url && file.preview && <Box component="img" src={file.preview} alt="" sx={{ ...sx, position: "absolute", inset: 0, filter: "blur(16px)" }} />}
      {!url && <CircularProgress aria-label="Opening status" sx={{ color: "#fff", position: "absolute" }} />}
      <Box sx={{ position: "relative", ...shape }}>
        {url && status.content.kind === "video" && (
          <Box component="video" ref={video} src={url} autoPlay playsInline onPlaying={onReady} aria-label={alt || "Video status"} sx={sx} />
        )}
        {url && status.content.kind === "image" && <Box component="img" src={url} alt={alt || "Photo status"} onLoad={onReady} sx={sx} />}
        {url &&
          mentions.map(({ userId, username, box }, index) => (
            <ButtonBase
              key={`${userId}-${index}`}
              aria-label={`Open @${username}'s profile`}
              onClick={() => onMention(userId)}
              sx={{ position: "absolute", left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.width * 100}%`, height: `${box.height * 100}%`, borderRadius: 99, pointerEvents: "auto" }}
            />
          ))}
      </Box>
    </Box>
  );
};

// arrow keys pressed in the list stay there, rather than moving the statuses behind it
const ViewersList = ({ views, onClose }) => {
  const messageTime = useMessageTime();
  return (
    <Dialog open onClose={onClose} onKeyDown={(event) => event.stopPropagation()} fullWidth maxWidth="xs" aria-labelledby="viewers-title">
      <DialogTitle id="viewers-title">Seen by {views.length}</DialogTitle>
      <DialogContent>
        <List disablePadding>
          {views.map(({ user, viewedAt }) => (
            <ListItem key={user._id} disableGutters>
              <ListItemAvatar>{getAvatar(user.avatar, user.firstName, 36)}</ListItemAvatar>
              <ListItemText primary={`${user.firstName} ${user.lastName}`} secondary={messageTime(viewedAt)} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

const StatusSlide = ({ status, position, count, isOwn, onNext, onPrevious, onClose }) => {
  const dispatch = useDispatch();
  const messageTime = useMessageTime();
  const [isReady, setIsReady] = useState(status.content.kind === "text");
  const [isListingViewers, setIsListingViewers] = useState(false);
  const [profileId, setProfileId] = useState(null);
  const friends = useSelector((state) => state.user.friends);
  const { friendRequests, sentRequests } = useSelector((state) => state.contact);
  const { owner, content } = status;
  const isPaused = isListingViewers || Boolean(profileId);
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
    <Box sx={{ position: "relative", height: "100%", width: "100%", maxWidth: 520, mx: "auto", display: "flex", flexDirection: "column" }}>
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

      {(content.caption || isOwn) && (
        <Stack alignItems="center" spacing={1} sx={{ px: 2, py: 1.5, color: "#fff", textAlign: "center" }}>
          {content.caption && <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{content.caption}</Typography>}
          {isOwn && (
            <Button startIcon={<Eye size={18} />} onClick={() => setIsListingViewers(true)} disabled={!status.views.length} sx={{ color: "#fff" }}>
              {status.views.length ? `Seen by ${status.views.length}` : "No views yet"}
            </Button>
          )}
        </Stack>
      )}

      {isListingViewers && <ViewersList views={status.views} onClose={() => setIsListingViewers(false)} />}
      {profileId && (
        <Box onKeyDown={(event) => event.stopPropagation()}>
          <UserProfileDrawer
            openDrawer
            toggleDrawer={() => setProfileId(null)}
            selectedUserData={{ _id: profileId }}
            {...relationTo(profileId)}
          />
        </Box>
      )}
    </Box>
  );
};

// people are shown in the order the list had when the viewer opened, so seeing a status does not reshuffle them
const StatusViewer = ({ ownerIds, startOwnerId, onClose }) => {
  const meId = useSelector((state) => state.user.user._id);
  const allStatuses = useSelector((state) => state.status.statuses);
  const statusesOf = (ownerId) => allStatuses.filter((status) => status.owner._id === ownerId && isLive(status));

  const [ownerIndex, setOwnerIndex] = useState(() => ownerIds.indexOf(startOwnerId));
  const [position, setPosition] = useState(() => firstUnseenIndex(statusesOf(startOwnerId)));
  const statuses = statusesOf(ownerIds[ownerIndex]);
  const status = statuses[Math.min(position, statuses.length - 1)];

  useEffect(() => {
    if (!status) onClose();
  }, [status, onClose]);

  if (!status) return null;

  const openOwner = (index) => {
    if (index >= ownerIds.length) return onClose();
    setOwnerIndex(index);
    setPosition(firstUnseenIndex(statusesOf(ownerIds[index])));
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
      PaperProps={{ "aria-label": "Status", onClick: closeFromOutside, sx: { bgcolor: "#000" } }}
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
