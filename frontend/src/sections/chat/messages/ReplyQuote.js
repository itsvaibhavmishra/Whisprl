import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { summaryOf } from "@/utils/messageSummary";

const ReplyQuote = ({ quote, authorName, isMine, onJump }) => (
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
      px: 1.25,
      py: 0.75,
      borderRadius: 1.5,
      borderLeft: 3,
      borderColor: isMine ? alpha("#fff", 0.7) : "primary.main",
      bgcolor: (theme) => (isMine ? alpha("#000", 0.14) : alpha(theme.palette.primary.main, 0.1)),
      cursor: onJump ? "pointer" : "default",
    }}
  >
    <Typography variant="caption" component="p" sx={{ m: 0, fontWeight: 700, color: isMine ? "inherit" : "primary.main" }}>
      {authorName}
    </Typography>
    <Typography variant="caption" component="p" noWrap sx={{ m: 0, opacity: 0.85 }}>
      {summaryOf(quote) || "Message"}
    </Typography>
  </Box>
);

export default ReplyQuote;
