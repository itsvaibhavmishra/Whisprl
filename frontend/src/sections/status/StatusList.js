import { Box, ButtonBase, CircularProgress, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { ImageSquare, TextT, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { CancelPosting, GetStatuses } from "@/redux/slices/actions/statusActions";
import { MIN_VISIBLE_PERCENT } from "@/sections/chat/messages/TransferRing";
import StatusRing from "@/sections/status/StatusRing";
import useMessageTime from "@/hooks/useMessageTime";
import getAvatar from "@/utils/avatars";

const AVATAR_SIZE = 52;

const rowButton = { gap: 1.5, py: 1, borderRadius: 2, justifyContent: "flex-start", textAlign: "left", "&:hover": { bgcolor: "action.hover" } };

const updatesCount = (count) => (count === 1 ? "1 update" : `${count} updates`);

const SectionLabel = ({ children }) => (
  <Typography variant="subtitle2" component="h2" sx={{ px: 1.5, pt: 2, pb: 0.5, color: "text.secondary" }}>
    {children}
  </Typography>
);

const PersonRow = ({ group, onOpen }) => {
  const messageTime = useMessageTime();
  return (
    <Box component="li" sx={{ listStyle: "none" }}>
      <ButtonBase onClick={() => onOpen(group.owner._id)} sx={{ ...rowButton, width: "100%", px: 1.5 }}>
        <StatusRing person={group.owner} statuses={group.statuses} size={AVATAR_SIZE} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {`${group.owner.firstName} ${group.owner.lastName}`}
          </Typography>
          <Typography variant="caption" component="p" sx={{ m: 0, color: "text.secondary" }}>
            {messageTime(group.latestAt)}
          </Typography>
        </Box>
      </ButtonBase>
    </Box>
  );
};

const PeopleSection = ({ label, groups, onOpen }) =>
  groups.length > 0 && (
    <>
      <SectionLabel>{label}</SectionLabel>
      <Box component="ul" sx={{ m: 0, p: 0 }}>
        {groups.map((group) => (
          <PersonRow key={group.owner._id} group={group} onOpen={onOpen} />
        ))}
      </Box>
    </>
  );

const PostingAvatar = ({ percent }) => {
  const { avatar, firstName } = useSelector((state) => state.user.user);
  return (
    <Box sx={{ position: "relative", width: AVATAR_SIZE, height: AVATAR_SIZE, flexShrink: 0, display: "grid", placeItems: "center" }}>
      <CircularProgress variant="determinate" value={Math.max(percent, MIN_VISIBLE_PERCENT)} size={AVATAR_SIZE} thickness={2.5} sx={{ position: "absolute" }} />
      {getAvatar(avatar, firstName, AVATAR_SIZE - 10)}
    </Box>
  );
};

const MyStatusRow = ({ group, onOpen, onWrite, onChooseMedia }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const posting = useSelector((state) => state.status.posting);
  const isEncryptionReady = useSelector((state) => state.encryption.status === "ready");
  const isPosting = posting !== null;
  const messageTime = useMessageTime();

  const detail = () => {
    if (isPosting) return `Sharing, ${posting}%`;
    if (group) return `${updatesCount(group.statuses.length)}, last at ${messageTime(group.latestAt)}`;
    return "Add a photo, video or text";
  };

  const avatar = () => {
    if (isPosting) return <PostingAvatar percent={posting} />;
    if (group) return <StatusRing person={user} statuses={group.statuses} size={AVATAR_SIZE} />;
    return getAvatar(user.avatar, user.firstName, AVATAR_SIZE);
  };

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 1 }}>
      <ButtonBase
        onClick={group ? onOpen : onChooseMedia}
        disabled={isPosting || !isEncryptionReady}
        sx={{ ...rowButton, flex: 1, minWidth: 0, px: 0.5 }}
      >
        {avatar()}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" noWrap>
            My status
          </Typography>
          <Typography variant="caption" component="p" noWrap sx={{ m: 0, color: "text.secondary" }}>
            {detail()}
          </Typography>
        </Box>
      </ButtonBase>
      {isPosting ? (
        <Tooltip title="Stop sharing">
          <IconButton aria-label="Stop sharing" onClick={() => dispatch(CancelPosting())}>
            <X size={20} />
          </IconButton>
        </Tooltip>
      ) : (
        <>
          <Tooltip title="Write a status">
            <span>
              <IconButton aria-label="Write a status" onClick={onWrite} disabled={!isEncryptionReady}>
                <TextT size={22} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Share a photo or video">
            <span>
              <IconButton aria-label="Share a photo or video" onClick={onChooseMedia} disabled={!isEncryptionReady}>
                <ImageSquare size={22} />
              </IconButton>
            </span>
          </Tooltip>
        </>
      )}
    </Stack>
  );
};

const StatusList = ({ myGroup, recent, viewed, onOpen, onOpenMine, onWrite, onChooseMedia }) => {
  const isLoading = useIsLoading(GetStatuses);

  return (
    <Stack component="nav" aria-label="Status updates" sx={{ height: "100%", bgcolor: "background.default" }}>
      <Box sx={{ px: 2.5, pt: 3, pb: 1.5 }}>
        <Typography component="h1" sx={{ m: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Status
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 2 }}>
        <MyStatusRow group={myGroup} onOpen={onOpenMine} onWrite={onWrite} onChooseMedia={onChooseMedia} />

        <PeopleSection label="Recent" groups={recent} onOpen={onOpen} />
        <PeopleSection label="Viewed" groups={viewed} onOpen={onOpen} />

        {!isLoading && !recent.length && !viewed.length && (
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", px: 3, py: 6 }}>
            No updates from your friends right now.
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

export default StatusList;
