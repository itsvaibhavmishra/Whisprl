import { useState } from "react";
import { Box, ButtonBase, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Check, DotsThree, LockSimple, Plus, Robot } from "phosphor-react";

import getAvatar from "@/utils/avatars";
import { firstNameIn, memberOf } from "@/utils/groups";

const faceOf = (seat, member, size, theme) => {
  if (seat.bot || seat.away) return <Robot size={size * 0.5} weight="duotone" />;
  if (member) return getAvatar(member.avatar, member.firstName, size);
  if (seat.locked) return <LockSimple size={size * 0.4} weight="bold" />;
  return <Plus size={size * 0.4} weight="bold" color={alpha(theme.ink, 0.7)} />;
};

const labelOf = (seat, conversation, meId) => {
  if (seat.bot) return "Bot";
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
        <DotsThree size={16} weight="bold" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {canLift && <MenuItem onClick={choose(onLift)}>Lift out</MenuItem>}
        {!seat.user && <MenuItem onClick={choose(onInvite)}>Save for someone</MenuItem>}
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

const Seat = ({ seat, conversation, meId, theme, size, mark, isDim = false, isTurn = false, note, onTake, onLeave, manage }) => {
  const member = seat.user && !seat.bot ? memberOf(conversation, seat.user) : null;
  const isMine = seat.user === meId;
  const onClick = isMine ? onLeave : !seat.user && onTake;

  return (
    <Box sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75, width: size + 24, opacity: isDim ? 0.45 : 1, ...MENU_ON_HOVER }}>
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
          bgcolor: theme.raised,
          border: `2px ${seat.user ? "solid" : "dashed"} ${alpha(theme.ink, isMine ? 0.9 : 0.35)}`,
          boxShadow: isTurn ? `0 0 0 4px ${mark?.color ?? theme.ink}` : "none",
          transition: "transform 160ms ease, box-shadow 200ms ease",
          "&:hover:not(:disabled)": { transform: "scale(1.06)" },
        }}
      >
        {faceOf(seat, member, size - 4, theme)}
      </ButtonBase>
      {seat.ready && (
        <Box sx={{ position: "absolute", top: size - 18, right: 6, width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#3BB273", color: "#fff" }}>
          <Check size={12} weight="bold" />
        </Box>
      )}
      {mark && (
        <Typography sx={{ position: "absolute", top: -4, left: 0, fontSize: 13, fontWeight: 800, color: mark.color }}>{mark.label}</Typography>
      )}
      <Typography noWrap sx={{ maxWidth: "100%", fontSize: 12, fontWeight: 700, color: alpha(theme.ink, 0.85) }}>
        {labelOf(seat, conversation, meId)}
      </Typography>
      {note && <Typography sx={{ fontSize: 11, color: alpha(theme.ink, 0.6), mt: -0.5 }}>{note}</Typography>}
      {manage && <SeatMenu seat={seat} meId={meId} {...manage} />}
    </Box>
  );
};

export default Seat;
