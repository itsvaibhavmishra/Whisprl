import { useEffect, useRef, useState } from "react";
import {
  Box,
  ButtonBase,
  CircularProgress,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { ChatCircleText } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { HISTORY_LIMIT, LoadHistory } from "@/redux/slices/actions/messageActions";
import { focusMessage } from "@/redux/slices/chatSlice";
import DocumentMessage from "@/sections/chat/messages/DocumentMessage";
import MediaTile from "@/sections/chat/messages/MediaTile";
import VoiceMessage from "@/sections/chat/messages/VoiceMessage";
import MediaViewer from "@/sections/chat/viewer/MediaViewer";
import { mediaItemsOf, mediaKeyOf } from "@/sections/chat/viewer/mediaItems";
import useMessageTime from "@/hooks/useMessageTime";
import { withArrivals } from "@/utils/chats";
import { linksIn } from "@/utils/links";
import { fileKeyOf, filesOf } from "@/utils/messageFiles";
import { formatDuration } from "@/utils/video";
import { gradientOf } from "@/utils/gradients";

const MEDIA_PAGE = 60;

const hostOf = (href) => {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
};

const TABS = [
  { value: "media", label: "Media" },
  { value: "voice", label: "Voice" },
  { value: "links", label: "Links" },
  { value: "docs", label: "Docs" },
];

const EMPTY_NOTES = {
  media: "Photos and videos shared in this chat show here.",
  voice: "Voice messages sent in this chat show here.",
  links: "Links shared in this chat show here.",
  docs: "Documents shared in this chat show here.",
};

const Empty = ({ children }) => (
  <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary", textAlign: "center", py: 4, px: 2 }}>
    {children}
  </Typography>
);

// the server cannot see what was shared, so this is gathered from the history decrypted in this browser
const SharedContent = ({ conversation }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const messageTime = useMessageTime();
  const gathered = useSelector((state) => state.chat.history[conversation._id]);
  const messages = useSelector((state) => state.chat.messages);
  const isGathering = useIsLoading(LoadHistory);
  const [tab, setTab] = useState("media");
  const [shownMedia, setShownMedia] = useState(MEDIA_PAGE);
  const [viewing, setViewing] = useState(null);
  const tiles = useRef([]);

  useEffect(() => {
    dispatch(LoadHistory(conversation._id));
  }, [dispatch, conversation._id]);

  const shared = withArrivals(gathered, messages).filter((message) => !message.deletedAt && !message.event && !message.viewOnce).reverse();
  const media = mediaItemsOf(shared);
  const documents = shared.flatMap(filesOf).filter((file) => file.fileType === "document");
  const voices = shared.flatMap((message) =>
    filesOf(message)
      .filter((file) => file.fileType === "voice")
      .map((file) => ({ file, message, isMine: message.sender?._id === meId }))
  );
  const links = shared.flatMap((message) => linksIn(message.message).map((link) => ({ ...link, messageId: message._id })));
  const counts = { media: media.length, voice: voices.length, links: links.length, docs: documents.length };

  const mediaGrid = () => (
    <>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.5 }}>
        {media.slice(0, shownMedia).map((item, index) => (
          <ButtonBase
            key={mediaKeyOf(item)}
            ref={(node) => {
              tiles.current[index] = node;
            }}
            onClick={() => setViewing(index)}
            aria-label={item.file.fileType === "video" ? `Open video, ${formatDuration(item.file.duration)}` : `Open ${item.file.fileName}`}
            sx={{ aspectRatio: "1", borderRadius: 2.5, overflow: "hidden" }}
          >
            <MediaTile file={item.file} />
          </ButtonBase>
        ))}
      </Box>
      {media.length > shownMedia && (
        <ButtonBase
          onClick={() => setShownMedia((count) => count + MEDIA_PAGE)}
          sx={{ width: "100%", py: 1.5, mt: 1, borderRadius: 1, color: "primary.main", fontWeight: 600 }}
        >
          Show more
        </ButtonBase>
      )}
      {viewing !== null && (
        <MediaViewer items={media} startIndex={viewing} conversation={conversation} tileOf={(index) => tiles.current[index]} onClose={() => setViewing(null)} />
      )}
    </>
  );

  const linkList = () => (
    <List disablePadding>
      {links.map(({ link, href, messageId }, index) => (
        <ListItem
          key={`${messageId}-${index}`}
          disableGutters
          secondaryAction={
            <Tooltip title="Show in chat">
              <IconButton edge="end" aria-label="Show in chat" onClick={() => dispatch(focusMessage(messageId))}>
                <ChatCircleText size={18} />
              </IconButton>
            </Tooltip>
          }
        >
          <ListItemText
            primary={
              <Link href={href} target="_blank" rel="noopener noreferrer" sx={{ wordBreak: "break-all" }}>
                {link}
              </Link>
            }
            secondary={hostOf(href)}
          />
        </ListItem>
      ))}
    </List>
  );

  const voiceList = () => (
    <Stack spacing={1.25}>
      {voices.map(({ file, message, isMine }, index) => (
        <Box key={fileKeyOf(file, index)}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: 4,
              color: isMine ? "common.white" : "text.primary",
              background: (theme) => (isMine ? gradientOf(theme.palette.primary.bubble) : theme.palette.chat.field),
            }}
          >
            <VoiceMessage file={file} isMine={isMine} />
          </Box>
          <Typography sx={{ mt: 0.5, px: 1, fontSize: 12, fontWeight: 600, color: "text.secondary" }}>
            {isMine ? "You" : message.sender?.firstName}, {messageTime(message.createdAt)}
          </Typography>
        </Box>
      ))}
    </Stack>
  );

  const tabContent = () => {
    if (isGathering && !counts[tab]) {
      if (tab !== "media") return <CircularProgress size={22} sx={{ display: "block", mx: "auto", my: 3 }} aria-label="Gathering shared items" />;
      return (
        <Box aria-label="Gathering shared items" role="progressbar" sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.5 }}>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} variant="rounded" sx={{ height: "auto", aspectRatio: "1", borderRadius: 2.5 }} />
          ))}
        </Box>
      );
    }
    if (!counts[tab]) return <Empty>{EMPTY_NOTES[tab]}</Empty>;
    if (tab === "media") return mediaGrid();
    if (tab === "voice") return voiceList();
    if (tab === "links") return linkList();
    return <DocumentMessage files={documents} />;
  };

  return (
    <Box component="section" aria-label="Shared in this chat" sx={{ pt: 1 }}>
      <Box sx={{ px: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="fullWidth"
          TabIndicatorProps={{ sx: { height: "100%", borderRadius: 99, bgcolor: "chat.raised", boxShadow: (theme) => `0 1px 3px ${theme.palette.chat.shade}, inset 0 0 0 1px ${theme.palette.chat.edge}` } }}
          sx={{ minHeight: 40, p: 0.5, borderRadius: 99, bgcolor: "chat.field" }}
        >
          {TABS.map(({ value, label }) => (
            <Tab
              key={value}
              value={value}
              label={
                <span>
                  {label}
                  {counts[value] > 0 && (
                    <Box component="span" sx={{ ml: 0.5, fontWeight: 600, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
                      {counts[value]}
                    </Box>
                  )}
                </span>
              }
              sx={{ zIndex: 1, minHeight: 32, "&:not(:last-of-type)": { mr: 0 }, fontSize: 13, fontWeight: 600, "&.Mui-selected": { color: "text.primary", fontWeight: 700 } }}
            />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ p: 2 }}>
        {tabContent()}
        {gathered && !gathered.isComplete && (
          <Typography variant="caption" component="p" sx={{ color: "text.secondary", textAlign: "center", mt: 2 }}>
            Showing what was shared in the latest {HISTORY_LIMIT.toLocaleString()} messages.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default SharedContent;
