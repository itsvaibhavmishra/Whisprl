import { useEffect, useRef, useState } from "react";
import { Box, ButtonBase, Dialog, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import { CaretLeft, CaretRight, X } from "phosphor-react";
import { useSelector } from "react-redux";

import StatusSlide, { CARD_HEIGHT } from "@/sections/status/StatusSlide";
import getAvatar from "@/utils/avatars";
import { backgroundOf, isLive } from "@/utils/statuses";

const NEIGHBOUR_WIDTH = `calc(${CARD_HEIGHT} * 0.42 * 9 / 16)`;
// space on any of these is theirs to use, so it only pauses when it lands on the player itself
const OWNS_SPACE = "button, a, input, textarea, [role=menuitem]";

const firstUnseenIndex = (statuses) => Math.max(0, statuses.findIndex((status) => status.isViewed === false));

const startIndexOf = (statuses, statusId) => {
  const asked = statuses.findIndex((status) => status._id === statusId);
  return asked === -1 ? firstUnseenIndex(statuses) : asked;
};

const Ambient = ({ status }) => (
  <Box aria-hidden sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
    {status.content.file?.preview ? (
      <Box sx={{ position: "absolute", inset: "-10%", backgroundImage: `url(${status.content.file.preview})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(64px) saturate(1.3)", opacity: 0.55 }} />
    ) : (
      <Box sx={{ position: "absolute", inset: 0, bgcolor: status.content.kind === "text" ? backgroundOf(status.content.background) : "transparent", opacity: 0.35 }} />
    )}
    <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0, 0, 0, 0.55)" }} />
  </Box>
);

const Neighbour = ({ status, label, onOpen }) => {
  if (!status) return <Box sx={{ width: NEIGHBOUR_WIDTH, flexShrink: 0 }} />;
  const { owner, content } = status;
  const name = `${owner.firstName} ${owner.lastName}`;

  return (
    <ButtonBase
      onClick={onOpen}
      aria-label={`${label}: ${name}`}
      sx={{
        position: "relative",
        flexShrink: 0,
        width: NEIGHBOUR_WIDTH,
        aspectRatio: "9 / 16",
        borderRadius: 1.5,
        overflow: "hidden",
        bgcolor: content.kind === "text" ? backgroundOf(content.background) : "#000",
        "& .neighbour-dim": { transition: "background-color 200ms ease" },
        "&:hover .neighbour-dim, &.Mui-focusVisible .neighbour-dim": { bgcolor: "rgba(0, 0, 0, 0.3)" },
        "&.Mui-focusVisible": { outline: 2, outlineColor: "#fff", outlineOffset: 3 },
      }}
    >
      {content.file?.preview && <Box component="img" src={content.file.preview} alt="" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
      <Box className="neighbour-dim" sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0, 0, 0, 0.6)" }} />
      <Stack alignItems="center" spacing={1} sx={{ position: "relative", px: 1, color: "#fff" }}>
        <Box sx={{ borderRadius: "50%", boxShadow: "0 0 0 2px #fff", display: "grid" }}>{getAvatar(owner.avatar, owner.firstName, 44)}</Box>
        <Typography sx={{ fontSize: 13, fontWeight: 700, textAlign: "center", lineHeight: 1.3 }}>{name}</Typography>
      </Stack>
    </ButtonBase>
  );
};

const Chevron = ({ label, isHidden, onClick, children }) => (
  <IconButton
    aria-label={label}
    onClick={onClick}
    disabled={isHidden}
    sx={{ flexShrink: 0, width: 44, height: 44, color: "#fff", bgcolor: "rgba(255, 255, 255, 0.12)", visibility: isHidden ? "hidden" : "visible", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.22)" } }}
  >
    {children}
  </IconButton>
);

// people play in the order the list had when the viewer opened, so seeing a status does not reshuffle them
const StatusViewer = ({ ownerIds, startOwnerId, startStatusId, onClose }) => {
  const isWide = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const hasNeighbours = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  // a phone on its side leaves the card too narrow to also hold Close, so Close moves beside it as on a computer
  const hasCloseBeside = useMediaQuery("(orientation: landscape)") || isWide;
  const meId = useSelector((state) => state.user.user._id);
  const friendsStatuses = useSelector((state) => state.status.statuses);
  const discover = useSelector((state) => state.status.discover);
  const allStatuses = [...friendsStatuses, ...discover];
  const statusesOf = (ownerId) => allStatuses.filter((status) => status.owner._id === ownerId && isLive(status));

  const [order] = useState(ownerIds);
  const [ownerIndex, setOwnerIndex] = useState(() => order.indexOf(startOwnerId));
  const [position, setPosition] = useState(() => startIndexOf(statusesOf(startOwnerId), startStatusId));
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [direction, setDirection] = useState(null);
  const isDownOnBackdrop = useRef(false);
  const statuses = statusesOf(order[ownerIndex]);
  const status = statuses[Math.min(position, statuses.length - 1)];

  useEffect(() => {
    if (!status) onClose();
  }, [status, onClose]);

  if (!status) return null;

  const openOwner = (index) => {
    if (index >= order.length) return onClose();
    setIsUserPaused(false);
    setOwnerIndex(index);
    setPosition(firstUnseenIndex(statusesOf(order[index])));
  };

  const jumpTo = (index, towards) => {
    setDirection(towards);
    openOwner(index);
  };

  // one person's updates follow on in place, and only a move to someone else turns in from the side
  const stepTo = (nextPosition) => {
    setIsUserPaused(false);
    setDirection(null);
    setPosition(nextPosition);
  };

  const next = () => {
    if (position < statuses.length - 1) stepTo(position + 1);
    else jumpTo(ownerIndex + 1, "next");
  };
  const previous = () => {
    if (position > 0) stepTo(position - 1);
    else if (ownerIndex > 0) jumpTo(ownerIndex - 1, "previous");
  };
  const isAtStart = position === 0 && ownerIndex === 0;

  const neighbourAt = (offset) => {
    const theirs = statusesOf(order[ownerIndex + offset]);
    return theirs.length ? theirs[firstUnseenIndex(theirs)] : null;
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowRight") next();
    if (event.key === "ArrowLeft") previous();
    if (event.key === " " && !event.repeat && !event.target.closest(OWNS_SPACE)) {
      event.preventDefault();
      setIsUserPaused(!isUserPaused);
    }
  };

  // the dark around the status stands in for a backdrop, so a click that starts and ends on it closes the viewer
  const closeFromOutside = (event) => event.target === event.currentTarget && isDownOnBackdrop.current && onClose();

  return (
    <Dialog
      open
      fullScreen
      onClose={onClose}
      onKeyDown={onKeyDown}
      PaperProps={{ "aria-label": "Status", sx: { position: "relative", overflow: "hidden", bgcolor: "#06090E", border: 0, boxShadow: "none", backgroundImage: "none" } }}
    >
      <Ambient status={status} />
      <Stack
        direction="row"
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="center"
        spacing={{ xs: 0, md: 3 }}
        onPointerDown={(event) => {
          isDownOnBackdrop.current = event.target === event.currentTarget;
        }}
        onClick={closeFromOutside}
        sx={{ position: "relative", height: "100%", px: { xs: 0, md: 2 } }}
      >
        {hasNeighbours && <Neighbour status={ownerIndex > 0 && neighbourAt(-1)} label="Previous" onOpen={() => jumpTo(ownerIndex - 1, "previous")} />}
        {isWide && (
          <Chevron label="Previous" isHidden={isAtStart} onClick={previous}>
            <CaretLeft size={22} weight="bold" />
          </Chevron>
        )}
        <StatusSlide
          key={status._id}
          status={status}
          position={statuses.indexOf(status)}
          count={statuses.length}
          isOwn={status.owner._id === meId}
          canReply={!discover.includes(status)}
          isWide={isWide}
          hasClose={!hasCloseBeside}
          direction={direction}
          isUserPaused={isUserPaused}
          onUserPause={setIsUserPaused}
          onNext={next}
          onPrevious={previous}
          onClose={onClose}
        />
        {isWide && (
          <Chevron label="Next" onClick={next}>
            <CaretRight size={22} weight="bold" />
          </Chevron>
        )}
        {hasNeighbours && <Neighbour status={ownerIndex < order.length - 1 && neighbourAt(1)} label="Next" onOpen={() => jumpTo(ownerIndex + 1, "next")} />}
      </Stack>
      {hasCloseBeside && (
        <IconButton aria-label="Close" onClick={onClose} sx={{ position: "absolute", top: 16, right: 16, width: 44, height: 44, color: "#fff", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.12)" } }}>
          <X size={22} weight="bold" />
        </IconButton>
      )}
    </Dialog>
  );
};

export default StatusViewer;
