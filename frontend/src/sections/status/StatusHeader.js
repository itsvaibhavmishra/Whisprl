import { Box, ButtonBase, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Flag, Globe, PaperPlaneTilt, Trash, X } from "phosphor-react";

import useMessageTime from "@/hooks/useMessageTime";
import getAvatar from "@/utils/avatars";

const HeaderButton = ({ label, onClick, children }) => (
  <Tooltip title={label}>
    <IconButton aria-label={label} onClick={onClick} sx={{ color: "inherit" }}>
      {children}
    </IconButton>
  </Tooltip>
);

const StatusHeader = ({ status, isOwn, onOpenProfile, onShare, onReport, onDelete, onClose }) => {
  const messageTime = useMessageTime();
  const { owner } = status;
  const name = isOwn ? "My status" : `${owner.firstName} ${owner.lastName}`;

  const who = (
    <>
      {getAvatar(owner.avatar, owner.firstName, 36)}
      <Box sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
        <Typography variant="subtitle2" noWrap>
          {name}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.8 }}>
          <Typography variant="caption">{messageTime(status.createdAt)}</Typography>
          {status.isPublic && <Globe size={13} role="img" aria-label="Shared with everyone on Whisprl" />}
        </Stack>
      </Box>
    </>
  );

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 1.5, py: 1, color: "#fff" }}>
      {isOwn ? (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
          {who}
        </Stack>
      ) : (
        <ButtonBase onClick={onOpenProfile} aria-label={`Open ${name}'s profile`} sx={{ flex: 1, minWidth: 0, gap: 1.5, justifyContent: "flex-start", borderRadius: 2 }}>
          {who}
        </ButtonBase>
      )}
      {status.isPublic && (
        <HeaderButton label="Send to friends" onClick={onShare}>
          <PaperPlaneTilt size={22} />
        </HeaderButton>
      )}
      {status.isPublic && !isOwn && (
        <HeaderButton label="Report this update" onClick={onReport}>
          <Flag size={22} />
        </HeaderButton>
      )}
      {isOwn && (
        <HeaderButton label="Delete status" onClick={onDelete}>
          <Trash size={22} />
        </HeaderButton>
      )}
      <HeaderButton label="Close" onClick={onClose}>
        <X size={22} />
      </HeaderButton>
    </Stack>
  );
};

export default StatusHeader;
