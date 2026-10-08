import { Box, ButtonBase, IconButton, Stack, Typography } from "@mui/material";
import { Eye, X } from "phosphor-react";

import useMessageTime from "@/hooks/useMessageTime";
import getAvatar from "@/utils/avatars";
import { reactionsLine, reactionsOf, topReactions } from "@/utils/statuses";

export const seenByLabel = (views) => (views.length ? `Seen by ${views.length}` : "No views yet");

const newestFirst = (views) => [...views].sort((one, other) => new Date(other.viewedAt) - new Date(one.viewedAt));

export const ViewsPill = ({ views, pillRef, onOpen }) => {
  const reactions = reactionsOf(views);
  const faces = newestFirst(views).slice(0, 3);

  return (
    <ButtonBase
      ref={pillRef}
      onClick={onOpen}
      disabled={!views.length}
      aria-label={`${seenByLabel(views)}${reactions.length ? `, ${reactionsLine(reactions.length)}` : ""}`}
      sx={{ gap: 1, height: 44, px: 1.75, borderRadius: 99, color: "#fff", bgcolor: "rgba(255, 255, 255, 0.12)", "&:hover": { bgcolor: "rgba(255, 255, 255, 0.2)" }, "&.Mui-disabled": { color: "rgba(255, 255, 255, 0.7)" } }}
    >
      {faces.length > 0 && (
        <Stack direction="row" sx={{ "& > *:not(:first-of-type)": { ml: -1 } }}>
          {faces.map(({ user }) => (
            <Box key={user._id} sx={{ borderRadius: "50%", border: "2px solid #10141C", display: "grid" }}>
              {getAvatar(user.avatar, user.firstName, 24)}
            </Box>
          ))}
        </Stack>
      )}
      <Eye size={18} aria-hidden />
      <Typography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>
        {views.length ? views.length : "No views yet"}
      </Typography>
      {reactions.length > 0 && (
        <Typography component="span" sx={{ fontSize: 14 }}>
          {topReactions(reactions)}
        </Typography>
      )}
    </ButtonBase>
  );
};

const SeenBy = ({ views, onClose }) => {
  const messageTime = useMessageTime();
  const reactions = reactionsOf(views);

  return (
    <Stack sx={{ minHeight: 0, height: "100%", color: "#fff" }}>
      <Stack direction="row" alignItems="center" sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <Typography id="seen-by-title" component="h2" sx={{ m: 0, fontSize: 16, fontWeight: 800 }}>
            {seenByLabel(views)}
          </Typography>
          {reactions.length > 0 && <Typography sx={{ fontSize: 13, fontWeight: 500, opacity: 0.65 }}>{reactionsLine(reactions.length)}</Typography>}
        </Box>
        {onClose && (
          <IconButton autoFocus aria-label="Close who saw this" onClick={onClose} sx={{ color: "inherit", mr: -1 }}>
            <X size={20} weight="bold" />
          </IconButton>
        )}
      </Stack>
      <Box component="ul" aria-labelledby="seen-by-title" sx={{ flex: 1, overflowY: "auto", m: 0, p: 0, pb: 1 }}>
        {newestFirst(views).map(({ user, viewedAt, reaction }) => (
          <Stack key={user._id} component="li" direction="row" spacing={1.5} alignItems="center" sx={{ listStyle: "none", px: 2.5, py: 1 }}>
            {getAvatar(user.avatar, user.firstName, 40)}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>
                {`${user.firstName} ${user.lastName}`}
              </Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 500, opacity: 0.65 }}>{messageTime(viewedAt)}</Typography>
            </Box>
            {reaction && (
              <Typography role="img" aria-label={`Reacted ${reaction}`} sx={{ fontSize: 22 }}>
                {reaction}
              </Typography>
            )}
          </Stack>
        ))}
      </Box>
    </Stack>
  );
};

export default SeenBy;
