import { Box, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

// a path that starts with two slashes or a backslash leaves the app, so neither counts as a link
const MARKUP = /(\*\*[^*]+\*\*|\[[^\]]+\]\(\/(?!\/)[\w\-/@.]*\))/;
const INNER_LINK = /^\[([^\]]+)\]\((\/(?!\/)[\w\-/@.]*)\)$/;

const inlineOf = (paragraph) =>
  paragraph.split(MARKUP).map((piece, index) => {
    if (piece.startsWith("**")) return <strong key={index}>{piece.slice(2, -2)}</strong>;
    const link = piece.match(INNER_LINK);
    if (!link) return piece;
    return (
      <Link key={index} component={RouterLink} to={link[2]} underline="none" sx={{ fontWeight: 700 }} onClick={(event) => event.stopPropagation()}>
        {link[1]}
      </Link>
    );
  });

// Whisprl's own words, where paragraphs, bold and links within the app are all it needs
const NoticeText = ({ text, sx }) => (
  <Typography component="div" variant="body2" sx={{ wordBreak: "break-word", ...sx }}>
    {text.split("\n\n").map((paragraph, index) => (
      <Box key={index} component="p" sx={{ m: 0, "& + &": { mt: 1 } }}>
        {inlineOf(paragraph)}
      </Box>
    ))}
  </Typography>
);

export default NoticeText;
