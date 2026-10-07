import { Box, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

import getAvatar from "@/utils/avatars";
import { summaryOf } from "@/utils/messageSummary";

// in a group the quote carries its author's photo, so a reply shows whose words it answers at a glance
const ReplyQuote = ({ quote, author, authorName, isMine, onJump }) => {
  const theme = useTheme();
  return (
    <Box
      role={onJump ? "button" : undefined}
      tabIndex={onJump ? 0 : undefined}
      aria-label={onJump ? `Go to the message from ${authorName}` : undefined}
      onClick={(event) => {
        event.stopPropagation();
        onJump?.();
      }}
      onKeyDown={(event) => {
        if (onJump && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onJump();
        }
      }}
      sx={{
        minWidth: 0,
        position: "relative",
        pl: 1.5,
        pr: 1.25,
        py: 0.75,
        borderRadius: 2.5,
        overflow: "hidden",
        bgcolor: isMine ? alpha("#fff", 0.16) : alpha(theme.palette.primary.main, 0.1),
        "&::before": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: isMine ? alpha("#fff", 0.8) : "primary.main" },
        cursor: onJump ? "pointer" : "default",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75}>
        {author && getAvatar(author.avatar, author.firstName, 16)}
        <Typography component="p" noWrap sx={{ m: 0, fontSize: 12.5, fontWeight: 800, color: isMine ? "inherit" : "primary.main" }}>
          {authorName}
        </Typography>
      </Stack>
      <Typography component="p" noWrap sx={{ m: 0, fontSize: 13, fontWeight: 500, opacity: 0.85 }}>
        {summaryOf(quote) || "Message"}
      </Typography>
    </Box>
  );
};

export default ReplyQuote;
