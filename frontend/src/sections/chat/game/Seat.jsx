import { useState } from "react";
import { Box, ButtonBase, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useSelector } from "react-redux";
import { CheckIcon, DotsThreeIcon, LockSimpleIcon, PlusIcon } from "@phosphor-icons/react";

import BotFace, { BOT_NAME } from "@/sections/chat/game/BotFace";
import { ON_SCRIM } from "@/sections/chat/game/scrim";
import { AvatarReaction, SeatSaying } from "@/sections/chat/game/RoomChatter";
import getAvatar from "@/utils/avatars";
import { isOnline } from "@/utils/chats";
import { firstNameIn, memberOf } from "@/utils/groups";

const faceOf = (seat, member, size) => {
  if (seat.bot || seat.away) return <BotFace size={size * 0.5} />;
  if (member) return getAvatar(member.avatar, member.firstName, size);
  if (seat.locked) return <LockSimpleIcon size={size * 0.4} weight="bold" />;
  return <PlusIcon size={size * 0.4} weight="bold" color={alpha("#fff", 0.85)} />;
};

const labelOf = (seat, conversation, meId) => {
  if (seat.bot) return BOT_NAME;
  if (seat.away) return `Bot for ${firstNameIn(conversation, seat.user, meId)}`;
  if (seat.user) return firstNameIn(conversation, seat.user, meId);
  if (seat.invited) return seat.invited === meId ? "For you" : `For ${firstNameIn(conversation, seat.invited, meId)}`;
  return seat.locked ? "Locked" : "Empty";
};

const SeatMenu = ({ seat, meId, onLift, onLock, onInvite }) => {
  const [anchor, setAnchor] = useState(null);
  const choose = (action) => () => {
    setAnchor(null);
    action();
  };
  const canLift = seat.user && seat.user !== meId && !seat.bot;

  return (
    <>
      <IconButton
        size="small"
        aria-label="Seat options"
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => setAnchor(event.currentTarget)}
        className="seat-menu"
        sx={{ position: "absolute", top: -6, right: -10, color: "inherit", bgcolor: "rgba(0,0,0,0.28)", "&:hover": { bgcolor: "rgba(0,0,0,0.4)" } }}
      >
        <DotsThreeIcon size={16} weight="bold" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {canLift && <MenuItem onClick={choose(onLift)}>Lift out</MenuItem>}
        {!seat.user && !seat.bot && <MenuItem onClick={choose(onInvite)}>Save for someone</MenuItem>}
        <MenuItem onClick={choose(() => onLock(!seat.locked))}>{seat.locked ? "Unlock" : "Lock"}</MenuItem>
      </Menu>
    </>
  );
};

// a menu on every seat is noise, so a pointer finds it on hover; a touch screen has no hover, so it stays
const MENU_ON_HOVER = {
  "@media (hover: hover)": {
    "& .seat-menu": { opacity: 0, transition: "opacity 120ms ease" },
    "&:hover .seat-menu, & .seat-menu:focus-visible, & .seat-menu[aria-expanded='true']": { opacity: 1 },
  },
};

export const READY_GREEN = "#3BB273";

// you and the bot are always here; anyone else is here when the app says they are online
export const isHere = (seat, member, meId, onlineFriends) => {
  if (seat.user === meId || (seat.bot && !seat.user)) return true;
  return Boolean(member && isOnline(member, onlineFriends));
};

const Seat = ({ seat, conversation, meId, theme, size, mark, onTake, onLeave, manage }) => {
  const onlineFriends = useSelector((state) => state.user.onlineFriends);
  const member = seat.user && !seat.bot ? memberOf(conversation, seat.user) : null;
  const isMine = seat.user === meId;
  const onClick = isMine ? onLeave : !seat.user && onTake;
  const badge = seat.ready ? 20 : 13;

  return (
    <Box sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75, width: size + 24, ...MENU_ON_HOVER }}>
      <Box sx={{ position: "relative" }}>
        <ButtonBase
          disabled={!onClick}
          onClick={onClick || undefined}
          aria-label={isMine && onLeave ? "Get up" : `${labelOf(seat, conversation, meId)} seat`}
          sx={{
            width: size,
            height: size,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            color: theme.ink,
            // an empty seat is only an outline, so it reads as a place to sit rather than as someone
            bgcolor: seat.user || seat.bot ? theme.card : "transparent",
            border: `2px ${seat.user || seat.bot ? "solid" : "dashed"} ${alpha("#fff", isMine ? 0.95 : 0.6)}`,
            transition: "transform 160ms ease",
            "&:hover:not(:disabled)": { transform: "scale(1.06)" },
          }}
        >
          {faceOf(seat, member, size - 4)}
        </ButtonBase>
        {seat.user && !seat.bot && <AvatarReaction user={seat.user} size={size} />}
      </Box>
      {/* a dot says they are here, and the same dot with a tick says they are here and ready */}
      {(seat.ready || isHere(seat, member, meId, onlineFriends)) && (
        <Box
          sx={{
            position: "absolute",
            top: size - badge + 1,
            left: `calc(50% + ${size / 2 - badge + 2}px)`,
            width: badge,
            height: badge,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: READY_GREEN,
            color: "#fff",
            boxShadow: "0 0 0 2.5px rgba(20, 14, 8, 0.85)",
          }}
        >
          {seat.ready && <CheckIcon size={11} weight="bold" />}
        </Box>
      )}
      <Typography noWrap sx={{ maxWidth: "100%", fontSize: 12, fontWeight: 700, color: ON_SCRIM, textShadow: "0 1px 3px rgba(0,0,0,0.45)" }}>
        {labelOf(seat, conversation, meId)}
      </Typography>
      {mark && <Box sx={{ width: 26, height: 26, opacity: seat.user || seat.bot ? 1 : 0.45 }}>{mark}</Box>}
      {manage && <SeatMenu seat={seat} meId={meId} {...manage} />}
      {seat.user && !seat.bot && <SeatSaying user={seat.user} theme={theme} />}
    </Box>
  );
};

export default Seat;
