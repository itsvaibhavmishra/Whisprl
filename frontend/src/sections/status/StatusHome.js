import { Box, Button, ButtonBase, IconButton, Stack, Typography } from "@mui/material";
import { ArrowLeft, CircleDashed, Eye, ImageSquare, LockSimple, Play, TextT } from "phosphor-react";
import { useSelector } from "react-redux";

import useMessageTime from "@/hooks/useMessageTime";
import ChatCanvas from "@/sections/chat/ChatCanvas";
import { seenByLabel } from "@/sections/status/SeenBy";
import { backgroundOf } from "@/utils/statuses";

const CARD_WIDTH = 150;

const reactionsOf = (views) => views.map((view) => view.reaction).filter(Boolean);

const reactionsSummary = (reactions) => `${[...new Set(reactions)].slice(0, 3).join("")} ${reactions.length}`;

const reactionsLabel = (reactions) => {
  if (!reactions.length) return "";
  return reactions.length === 1 ? ", 1 reaction" : `, ${reactions.length} reactions`;
};

const UpdateCard = ({ status, onPlay }) => {
  const messageTime = useMessageTime();
  const { content } = status;
  const reactions = reactionsOf(status.views);

  return (
    <ButtonBase
      onClick={() => onPlay(status._id)}
      aria-label={`Your update from ${messageTime(status.createdAt)}, ${seenByLabel(status.views)}${reactionsLabel(reactions)}`}
      sx={{ flexDirection: "column", alignItems: "stretch", width: "100%", borderRadius: 3, overflow: "hidden", bgcolor: "background.paper", textAlign: "left", boxShadow: (theme) => `0 12px 28px -18px ${theme.palette.chat.shade}` }}
    >
      <Box sx={{ position: "relative", aspectRatio: "9 / 16", display: "grid", placeItems: "center", bgcolor: content.kind === "text" ? backgroundOf(content.background) : "#000" }}>
        {content.file?.preview && <Box component="img" src={content.file.preview} alt="" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        {content.kind === "text" && (
          <Typography sx={{ px: 1.5, color: "#fff", fontSize: 13, fontWeight: 700, textAlign: "center", overflowWrap: "anywhere", display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {content.text}
          </Typography>
        )}
        {content.kind === "video" && (
          <Box sx={{ position: "absolute", right: 8, bottom: 8, display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: "50%", color: "#fff", bgcolor: "rgba(0, 0, 0, 0.55)" }}>
            <Play size={14} weight="fill" />
          </Box>
        )}
      </Box>
      <Stack spacing={0.25} sx={{ px: 1.25, py: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {messageTime(status.createdAt)}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary" }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Eye size={15} />
            <Typography variant="caption">{status.views.length}</Typography>
          </Stack>
          {reactions.length > 0 && <Typography variant="caption">{reactionsSummary(reactions)}</Typography>}
        </Stack>
      </Stack>
    </ButtonBase>
  );
};

const StatusHome = ({ statuses, onWrite, onChooseMedia, onPlay, onBack }) => {
  const isEncryptionReady = useSelector((state) => state.encryption.status === "ready");
  const newestFirst = [...statuses].reverse();

  return (
    <ChatCanvas sx={{ height: "100%", overflowY: "auto" }}>
      <Stack spacing={3} sx={{ maxWidth: 880, mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 2, md: 4 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 1.5 }}>
          {onBack && (
            <IconButton aria-label="Back" onClick={onBack}>
              <ArrowLeft size={22} />
            </IconButton>
          )}
          <Typography component="h2" sx={{ flex: 1, m: 0, fontSize: 24, fontWeight: 800 }}>
            Your updates
          </Typography>
          <Button variant="outlined" startIcon={<TextT size={18} />} onClick={onWrite} disabled={!isEncryptionReady}>
            Write
          </Button>
          <Button variant="contained" startIcon={<ImageSquare size={18} />} onClick={onChooseMedia} disabled={!isEncryptionReady}>
            Photo or video
          </Button>
        </Stack>

        {newestFirst.length ? (
          <Box component="ul" aria-label="Your live updates" sx={{ m: 0, p: 0, listStyle: "none", display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${CARD_WIDTH}px, 1fr))`, gap: 2 }}>
            {newestFirst.map((status) => (
              <li key={status._id}>
                <UpdateCard status={status} onPlay={onPlay} />
              </li>
            ))}
          </Box>
        ) : (
          <Stack alignItems="center" spacing={2} sx={{ alignSelf: "center", maxWidth: 420, p: 4, borderRadius: 4, textAlign: "center", bgcolor: "background.paper" }}>
            <Box sx={{ color: "primary.main" }}>
              <CircleDashed size={56} weight="bold" aria-hidden />
            </Box>
            <Typography sx={{ color: "text.secondary" }}>Share a photo, video or a few words with your friends. Each update disappears after 24 hours.</Typography>
          </Stack>
        )}

        <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center" sx={{ color: "text.secondary" }}>
          <LockSimple size={14} aria-hidden />
          <Typography variant="caption">Your status updates are end-to-end encrypted.</Typography>
        </Stack>
      </Stack>
    </ChatCanvas>
  );
};

export default StatusHome;
