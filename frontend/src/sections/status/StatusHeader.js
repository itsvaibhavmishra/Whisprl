import { useState } from "react";
import { Box, ButtonBase, IconButton, ListItemIcon, Menu, MenuItem, Stack, Tooltip, Typography } from "@mui/material";
import { DotsThree, Flag, PaperPlaneTilt, Pause, Play, Trash, X } from "phosphor-react";

import useMessageTime from "@/hooks/useMessageTime";
import EveryonePill from "@/sections/status/EveryonePill";
import { keepKeys } from "@/sections/status/ReplyBar";
import getAvatar from "@/utils/avatars";
import { ageOf } from "@/utils/statuses";

const ON_MEDIA = { color: "rgba(255, 255, 255, 0.88)", "&:hover": { color: "#fff", bgcolor: "rgba(255, 255, 255, 0.12)" } };

const HeaderButton = ({ label, onClick, children, sx, ...button }) => (
  <Tooltip title={label}>
    <IconButton aria-label={label} onClick={onClick} sx={{ width: 40, height: 40, ...ON_MEDIA, ...sx }} {...button}>
      {children}
    </IconButton>
  </Tooltip>
);

// the menu hands each item its focus props, so they must reach the MenuItem for the keyboard to work
const MoreItem = ({ icon: Icon, label, isDanger, ...item }) => (
  <MenuItem {...item} sx={isDanger ? { color: "error.main" } : undefined}>
    <ListItemIcon sx={{ color: "inherit" }}>
      <Icon size={20} />
    </ListItemIcon>
    {label}
  </MenuItem>
);

// what is rare or destructive waits behind ⋯, so the header holds only who, when, pause and close
const StatusHeader = ({ status, isOwn, isPaused, hasClose, onTogglePause, onMoreOpen, onOpenProfile, onShare, onReport, onDelete, onClose }) => {
  const messageTime = useMessageTime();
  const [moreAnchor, setMoreAnchor] = useState(null);
  const { owner } = status;
  const name = isOwn ? "My status" : `${owner.firstName} ${owner.lastName}`;
  const items = [
    status.isPublic && { key: "share", icon: PaperPlaneTilt, label: "Send to friends", onClick: onShare },
    status.isPublic && !isOwn && { key: "report", icon: Flag, label: "Report this update", onClick: onReport, isDanger: true },
    isOwn && { key: "delete", icon: Trash, label: "Delete update", onClick: onDelete, isDanger: true },
  ].filter(Boolean);

  const showMore = (anchor) => {
    setMoreAnchor(anchor);
    onMoreOpen(Boolean(anchor));
  };

  const choose = (onClick) => () => {
    showMore(null);
    onClick();
  };

  const who = (
    <>
      {getAvatar(owner.avatar, owner.firstName, 32)}
      <Box sx={{ minWidth: 0, textAlign: "left" }}>
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35, mb: 0.375 }}>
          {name}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title={messageTime(status.createdAt)}>
            <Typography component="span" sx={{ flexShrink: 0, whiteSpace: "nowrap", fontSize: 12, fontWeight: 600, opacity: 0.85 }}>
              {ageOf(status.createdAt)}
            </Typography>
          </Tooltip>
          {status.isPublic && <EveryonePill isOnMedia />}
        </Stack>
      </Box>
    </>
  );

  return (
    <Stack direction="row" alignItems="center" spacing={0.25} sx={{ px: 1, py: 0.75, color: "#fff", textShadow: "0 1px 3px rgba(0, 0, 0, 0.45)" }}>
      {isOwn ? (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, minWidth: 0, pl: 0.5 }}>
          {who}
        </Stack>
      ) : (
        <ButtonBase
          onClick={onOpenProfile}
          aria-label={`Open ${name}'s profile`}
          sx={{ flex: 1, minWidth: 0, gap: 1.5, justifyContent: "flex-start", borderRadius: 99, py: 0.25, pl: 0.5, pr: 1, "&.Mui-focusVisible": { outline: 2, outlineColor: "#fff" } }}
        >
          {who}
        </ButtonBase>
      )}
      <Box sx={{ flexShrink: 0, display: "flex" }}>
        <HeaderButton label={isPaused ? "Play" : "Pause"} onClick={onTogglePause} sx={{ "@container (max-width: 260px)": { display: "none" } }}>
          {isPaused ? <Play size={20} weight="fill" /> : <Pause size={20} weight="fill" />}
        </HeaderButton>
        {items.length > 0 && (
          <HeaderButton label="More options" aria-haspopup="menu" onClick={(event) => showMore(event.currentTarget)}>
            <DotsThree size={22} weight="bold" />
          </HeaderButton>
        )}
        {hasClose && (
          <HeaderButton label="Close" onClick={onClose}>
            <X size={20} weight="bold" />
          </HeaderButton>
        )}
      </Box>
      <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => showMore(null)} onKeyDown={keepKeys} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        {items.map(({ key, onClick, ...item }) => (
          <MoreItem key={key} {...item} onClick={choose(onClick)} />
        ))}
      </Menu>
    </Stack>
  );
};

export default StatusHeader;
