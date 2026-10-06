import { useEffect, useState } from "react";
import {
  Box,
  ButtonBase,
  CircularProgress,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
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
import MediaLightbox from "@/sections/chat/messages/MediaLightbox";
import MediaTile from "@/sections/chat/messages/MediaTile";
import { withArrivals } from "@/utils/chats";
import { linksIn } from "@/utils/links";
import { fileKeyOf, filesOf } from "@/utils/messageFiles";
import { formatDuration } from "@/utils/video";

const MEDIA_PAGE = 60;

const hostOf = (href) => {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
};

const Empty = ({ children }) => (
  <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
    {children}
  </Typography>
);

// the server cannot see what was shared, so this is gathered from the history decrypted in this browser
const SharedContent = ({ conversation }) => {
  const dispatch = useDispatch();
  const gathered = useSelector((state) => state.chat.history[conversation._id]);
  const messages = useSelector((state) => state.chat.messages);
  const isGathering = useIsLoading(LoadHistory);
  const [tab, setTab] = useState("media");
  const [shownMedia, setShownMedia] = useState(MEDIA_PAGE);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    dispatch(LoadHistory(conversation._id));
  }, [dispatch, conversation._id]);

  const shared = withArrivals(gathered, messages).filter((message) => !message.deletedAt && !message.event && !message.viewOnce).reverse();
  const filesOfKind = (...kinds) =>
    shared.flatMap((message) => filesOf(message).filter((file) => kinds.includes(file.fileType)).map((file) => ({ ...file, messageId: message._id })));
  const media = filesOfKind("image", "video");
  const documents = filesOfKind("document");
  const links = shared.flatMap((message) => linksIn(message.message).map((link) => ({ ...link, messageId: message._id })));
  const counts = { media: media.length, links: links.length, docs: documents.length };

  const mediaGrid = () => (
    <>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.5 }}>
        {media.slice(0, shownMedia).map((file, index) => (
          <ButtonBase
            key={fileKeyOf(file, index)}
            onClick={() => setViewing(index)}
            aria-label={file.fileType === "video" ? `Open video, ${formatDuration(file.duration)}` : `Open ${file.fileName}`}
            sx={{ aspectRatio: "1", borderRadius: 1, overflow: "hidden" }}
          >
            <MediaTile file={file} />
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
      <MediaLightbox open={viewing !== null} onClose={() => setViewing(null)} items={media} startIndex={viewing ?? 0} />
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

  const tabContent = () => {
    if (isGathering && !counts[tab]) {
      return <CircularProgress size={22} sx={{ display: "block", mx: "auto", my: 3 }} aria-label="Gathering shared items" />;
    }
    if (tab === "media") return media.length ? mediaGrid() : <Empty>Photos and videos shared in this chat show here.</Empty>;
    if (tab === "links") return links.length ? linkList() : <Empty>Links shared in this chat show here.</Empty>;
    return documents.length ? <DocumentMessage files={documents} /> : <Empty>Documents shared in this chat show here.</Empty>;
  };

  return (
    <Box>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth" sx={{ px: 2 }}>
        <Tab value="media" label={`Media ${counts.media || ""}`.trim()} />
        <Tab value="links" label={`Links ${counts.links || ""}`.trim()} />
        <Tab value="docs" label={`Docs ${counts.docs || ""}`.trim()} />
      </Tabs>

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
