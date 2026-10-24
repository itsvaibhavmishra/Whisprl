import { Fragment } from "react";
import { Box, Link, Typography } from "@mui/material";

import { splitLinks } from "@/utils/links";

const escapeForPattern = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const withMentions = (text, mentionNames, isMine) => {
  if (!mentionNames.length) return text;
  const pattern = new RegExp(`(@(?:${mentionNames.map(escapeForPattern).join("|")}))`, "g");
  return text.split(pattern).map((piece, index) =>
    index % 2 ? (
      <Box key={index} component="span" sx={{ fontWeight: 700, color: isMine ? "inherit" : "primary.main" }}>
        {piece}
      </Box>
    ) : (
      piece
    )
  );
};

const MessageText = ({ text, mentionNames = [], isMine, variant = "body2", trailing, sx }) => (
  <Typography data-searchable variant={variant} component="p" sx={{ m: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", ...sx }}>
    {splitLinks(text).map((part, index) =>
      part.href ? (
        <Link
          key={index}
          href={part.href}
          target="_blank"
          rel="noopener noreferrer"
          color="inherit"
          underline="always"
          onClick={(event) => event.stopPropagation()}
        >
          {part.text}
        </Link>
      ) : (
        <Fragment key={index}>{withMentions(part.text, mentionNames, isMine)}</Fragment>
      )
    )}
    {trailing}
  </Typography>
);

export default MessageText;
