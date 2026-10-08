import { useState } from "react";
import { Box, Button, ButtonBase, IconButton, ListItemIcon, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { DotsThree, Eye, PaperPlaneTilt, Play, Plus, Trash } from "phosphor-react";
import { useSelector } from "react-redux";

import DeleteUpdateDialog from "@/sections/status/DeleteUpdateDialog";
import EveryonePill from "@/sections/status/EveryonePill";
import NewUpdateMenu, { NewUpdateButton } from "@/sections/status/NewUpdateMenu";
import { seenByLabel } from "@/sections/status/SeenBy";
import ShareStatusDialog from "@/sections/status/ShareStatusDialog";
import { rowSx } from "@/sections/status/StatusList";
import StatusPane, { PaneEmpty } from "@/sections/status/StatusPane";
import { ageOf, backgroundOf, reactionsLine, reactionsOf, topReactions } from "@/utils/statuses";

const Thumbnail = ({ content }) => (
  <Box sx={{ position: "relative", width: 54, height: 96, flexShrink: 0, borderRadius: 1.5, overflow: "hidden", bgcolor: content.kind === "text" ? backgroundOf(content.background) : "chat.field" }}>
    {content.file?.preview && <Box component="img" src={content.file.preview} alt="" sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />}
    {content.kind === "video" && (
      <Box sx={{ position: "absolute", right: 4, bottom: 4, display: "grid", placeItems: "center", width: 20, height: 20, borderRadius: "50%", color: "#fff", bgcolor: "rgba(0, 0, 0, 0.5)" }}>
        <Play size={10} weight="fill" />
      </Box>
    )}
  </Box>
);

const UpdateRow = ({ status, onPlay, onMore }) => {
  const reactions = reactionsOf(status.views);
  const shared = `Shared ${ageOf(status.createdAt).toLowerCase()}`;

  return (
    <Stack component="li" direction="row" alignItems="center" spacing={0.5} sx={{ listStyle: "none" }}>
      <ButtonBase
        onClick={() => onPlay(status._id)}
        aria-label={`Your update from ${ageOf(status.createdAt)}${status.isPublic ? ", shared with everyone" : ""}, ${seenByLabel(status.views)}${reactions.length ? `, ${reactionsLine(reactions.length)}` : ""}`}
        sx={{ ...rowSx, flex: 1, minWidth: 0 }}
      >
        <Thumbnail content={status.content} />
        <Box sx={{ minWidth: 0, flex: 1, containerType: "inline-size" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography noWrap sx={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
              {shared}
            </Typography>
            {status.isPublic && <EveryonePill />}
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5, color: "text.secondary" }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Eye size={16} aria-hidden />
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{status.views.length ? `${status.views.length} ${status.views.length === 1 ? "view" : "views"}` : "No views yet"}</Typography>
            </Stack>
            {reactions.length > 0 && (
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                {topReactions(reactions)} {reactions.length}
              </Typography>
            )}
          </Stack>
        </Box>
      </ButtonBase>
      <IconButton aria-label="More for this update" aria-haspopup="menu" onClick={(event) => onMore({ anchor: event.currentTarget, status })}>
        <DotsThree size={22} weight="bold" />
      </IconButton>
    </Stack>
  );
};

// newest first to manage, though playing still runs oldest to newest from whichever one is picked
const YourUpdates = ({ statuses, onWrite, onChooseMedia, onPlay, onBack }) => {
  const canCreate = useSelector((state) => state.encryption.status === "ready" && state.status.posting === null);
  const [createAnchor, setCreateAnchor] = useState(null);
  const [more, setMore] = useState(null);
  const [dialog, setDialog] = useState(null);
  const newestFirst = [...statuses].reverse();

  const open = (kind) => () => {
    setDialog({ kind, status: more.status });
    setMore(null);
  };

  return (
    <StatusPane
      title="Your updates"
      subtitle="Each update disappears 24 hours after you share it"
      onBack={onBack}
      action={onBack && <NewUpdateButton onOpen={setCreateAnchor} disabled={!canCreate} />}
    >
      {newestFirst.length ? (
        <Box component="ul" aria-label="Your live updates" sx={{ m: 0, p: 0, maxWidth: 560, mx: -1.25 }}>
          {newestFirst.map((status) => (
            <UpdateRow key={status._id} status={status} onPlay={onPlay} onMore={setMore} />
          ))}
        </Box>
      ) : (
        <PaneEmpty text="Nothing shared in the last 24 hours.">
          <Button variant="contained" startIcon={<Plus size={18} weight="bold" />} onClick={(event) => setCreateAnchor(event.currentTarget)} disabled={!canCreate}>
            New update
          </Button>
        </PaneEmpty>
      )}

      <NewUpdateMenu anchor={createAnchor} onClose={() => setCreateAnchor(null)} onWrite={onWrite} onChooseMedia={onChooseMedia} />
      <Menu anchorEl={more?.anchor} open={Boolean(more)} onClose={() => setMore(null)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }} transformOrigin={{ vertical: "top", horizontal: "right" }}>
        {more?.status.isPublic && (
          <MenuItem onClick={open("share")}>
            <ListItemIcon>
              <PaperPlaneTilt size={20} />
            </ListItemIcon>
            Send to friends
          </MenuItem>
        )}
        <MenuItem onClick={open("delete")} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <Trash size={20} />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
      {dialog?.kind === "share" && <ShareStatusDialog status={dialog.status} onClose={() => setDialog(null)} />}
      {dialog?.kind === "delete" && <DeleteUpdateDialog status={dialog.status} onClose={() => setDialog(null)} />}
    </StatusPane>
  );
};

export default YourUpdates;
