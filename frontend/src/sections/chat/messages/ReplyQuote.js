import { useEffect, useState } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useSelector } from "react-redux";

import MediaTile from "@/sections/chat/messages/MediaTile";
import MediaViewer from "@/sections/chat/viewer/MediaViewer";
import { mediaItemsOf } from "@/sections/chat/viewer/mediaItems";
import getAvatar from "@/utils/avatars";
import { thumbnailFileOf } from "@/utils/messageFiles";
import { quoteSummaryOf } from "@/utils/messageSummary";

// read from the chat rather than the quote, so a reaction made in the viewer shows on the photo at once
const QuotedViewer = ({ messageId, conversation, onClose }) => {
  const quoted = useSelector((state) => state.chat.messages.find((message) => message._id === messageId));
  const items = quoted ? mediaItemsOf([quoted]) : [];

  useEffect(() => {
    if (!items.length) onClose();
  }, [items.length, onClose]);

  return items.length ? <MediaViewer items={items} conversation={conversation} onClose={onClose} /> : null;
};

// in a group the quote carries its author's photo, so a reply shows whose words it answers at a glance
const ReplyQuote = ({ quote, isAlbum, author, authorName, isMine, conversation, onJump }) => {
  const theme = useTheme();
  const meId = useSelector((state) => state.user.user._id);
  // a view-once message can be opened after the reply quoting it, so its state is read from the chat as it is now
  const current = useSelector((state) => quote.viewOnce && state.chat.messages.find((message) => message._id === quote._id));
  const [isViewing, setIsViewing] = useState(false);
  const photo = !quote.deletedAt && thumbnailFileOf(quote);
  // a whole group has no one photo to open, so its quote only takes you to it
  const opensPhoto = Boolean(photo) && !isAlbum;
  const go = opensPhoto ? () => setIsViewing(true) : onJump;
  const goLabel = opensPhoto ? `Open the ${photo.fileType === "video" ? "video" : "photo"} from ${authorName}` : `Go to the message from ${authorName}`;
  const summary = isAlbum && !quote.deletedAt ? quote.message || "Photos" : quoteSummaryOf(current || quote, meId) || "Message";

  return (
    <>
      <Box
        role={go ? "button" : undefined}
        tabIndex={go ? 0 : undefined}
        aria-label={go ? goLabel : undefined}
        onClick={(event) => {
          event.stopPropagation();
          go?.();
        }}
        onKeyDown={(event) => {
          if (go && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            go();
          }
        }}
        sx={{
          minWidth: 0,
          position: "relative",
          display: "flex",
          borderRadius: 2.5,
          overflow: "hidden",
          bgcolor: isMine ? alpha("#fff", 0.16) : alpha(theme.palette.primary.main, 0.1),
          "&::before": { content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: isMine ? alpha("#fff", 0.8) : "primary.main" },
          cursor: go ? "pointer" : "default",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, pl: 1.5, pr: 1.25, py: 0.75 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {author && getAvatar(author.avatar, author.firstName, 16)}
            <Typography component="p" noWrap sx={{ m: 0, fontSize: 12.5, fontWeight: 800, color: isMine ? "inherit" : "primary.main" }}>
              {authorName}
            </Typography>
          </Stack>
          <Typography component="p" noWrap sx={{ m: 0, fontSize: 13, fontWeight: 500, opacity: 0.85 }}>
            {summary}
          </Typography>
        </Box>
        {photo && (
          // laid over its slot, so a tall photo fills the quote's height instead of stretching it
          <Box sx={{ position: "relative", width: 48, flexShrink: 0 }}>
            <Box sx={{ position: "absolute", inset: 0 }}>
              <MediaTile file={photo} isSmall />
            </Box>
          </Box>
        )}
      </Box>
      {isViewing && (
        <QuotedViewer
          messageId={quote._id}
          conversation={conversation}
          onClose={() => {
            setIsViewing(false);
            onJump?.();
          }}
        />
      )}
    </>
  );
};

export default ReplyQuote;
