import { List, ListItem, ListItemAvatar, ListItemText, Stack, Typography } from "@mui/material";

import useMessageTime from "@/hooks/useMessageTime";
import getAvatar from "@/utils/avatars";

export const seenByLabel = (views) => (views.length ? `Seen by ${views.length}` : "No views yet");

const SeenBy = ({ views }) => {
  const messageTime = useMessageTime();
  const newestFirst = [...views].sort((one, other) => new Date(other.viewedAt) - new Date(one.viewedAt));

  return (
    <Stack sx={{ minHeight: 0, height: "100%" }}>
      <Typography id="seen-by-title" variant="subtitle1" component="h2" sx={{ px: 2, pt: 2, pb: 1, fontWeight: 800 }}>
        {seenByLabel(views)}
      </Typography>
      <List aria-labelledby="seen-by-title" sx={{ flex: 1, overflowY: "auto", px: 1 }}>
        {newestFirst.map(({ user, viewedAt, reaction }) => (
          <ListItem key={user._id} secondaryAction={reaction && <Typography role="img" aria-label={`Reacted ${reaction}`} sx={{ fontSize: 22 }}>{reaction}</Typography>}>
            <ListItemAvatar>{getAvatar(user.avatar, user.firstName, 36)}</ListItemAvatar>
            <ListItemText
              primary={`${user.firstName} ${user.lastName}`}
              secondary={messageTime(viewedAt)}
              secondaryTypographyProps={{ color: "inherit", sx: { opacity: 0.7 } }}
            />
          </ListItem>
        ))}
      </List>
    </Stack>
  );
};

export default SeenBy;
