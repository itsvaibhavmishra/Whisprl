import { useCallback, useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { CircleDashed, LockSimple } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { GetStatuses } from "@/redux/slices/actions/statusActions";
import ChatCanvas from "@/sections/chat/ChatCanvas";
import StatusComposer from "@/sections/status/StatusComposer";
import StatusList from "@/sections/status/StatusList";
import StatusViewer from "@/sections/status/StatusViewer";
import { groupByOwner, isLive } from "@/utils/statuses";

const LIST_WIDTH = 360;

const EmptyPane = () => (
  <ChatCanvas sx={{ height: "100%", display: "grid", placeItems: "center", px: 3 }}>
    <Stack alignItems="center" spacing={2} sx={{ textAlign: "center", maxWidth: 420, bgcolor: "background.paper", borderRadius: 4, p: 4 }}>
      <Box sx={{ color: "primary.main" }}>
        <CircleDashed size={56} weight="bold" aria-hidden />
      </Box>
      <Typography sx={{ color: "text.secondary" }}>
        Share a photo, video or a few words with your friends. Each update disappears after 24 hours.
      </Typography>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
        <LockSimple size={14} aria-hidden />
        <Typography variant="caption">Your status updates are end-to-end encrypted.</Typography>
      </Stack>
    </Stack>
  </ChatCanvas>
);

const Status = () => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const isEncryptionReady = useSelector((state) => state.encryption.status === "ready");
  const statuses = useSelector((state) => state.status.statuses);
  const [viewing, setViewing] = useState(null);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (isEncryptionReady) dispatch(GetStatuses());
  }, [dispatch, isEncryptionReady]);

  const groups = groupByOwner(statuses.filter((status) => isLive(status)));
  const myGroup = groups.find((group) => group.owner._id === meId);
  const friends = groups.filter((group) => group !== myGroup);
  const recent = friends.filter((group) => group.hasUnseen);
  const viewed = friends.filter((group) => !group.hasUnseen);

  // your own updates play on their own; a friend's run on through everyone listed after them
  const open = (ownerId) => {
    const ownerIds = ownerId === meId ? [meId] : [...recent, ...viewed].map((group) => group.owner._id);
    setViewing({ ownerIds, startOwnerId: ownerId });
  };
  const closeViewer = useCallback(() => setViewing(null), []);

  return (
    <Box sx={{ display: "flex", flexGrow: 1, minWidth: 0, height: { xs: "calc(100dvh - 65px)", md: "100dvh" }, bgcolor: "background.default" }}>
      <Box sx={{ width: { xs: "100%", md: LIST_WIDTH }, flexShrink: 0, borderRight: 1, borderColor: "divider" }}>
        <StatusList myGroup={myGroup} recent={recent} viewed={viewed} onOpen={open} onCompose={setDraft} />
      </Box>

      <Box component="main" sx={{ display: { xs: "none", md: "block" }, flex: 1, minWidth: 0 }}>
        <EmptyPane />
      </Box>

      {viewing && <StatusViewer {...viewing} onClose={closeViewer} />}
      {draft && <StatusComposer draft={draft} onClose={() => setDraft(null)} />}
    </Box>
  );
};

export default Status;
