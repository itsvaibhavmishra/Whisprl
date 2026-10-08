import { useState } from "react";
import { Box, ButtonBase, CircularProgress, IconButton, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CaretRight, Compass, LockSimple, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import Wordmark from "@/components/Wordmark";
import { CancelPosting } from "@/redux/slices/actions/statusActions";
import ChatAvatar from "@/sections/chat/ChatAvatar";
import { MIN_VISIBLE_PERCENT } from "@/sections/chat/messages/TransferRing";
import NewUpdateMenu, { NewUpdateButton } from "@/sections/status/NewUpdateMenu";
import { SPOKEN_ONLY } from "@/utils/spokenOnly";
import { ageOf } from "@/utils/statuses";

const AVATAR_SIZE = 50;

export const rowSx = {
  width: "100%",
  gap: 1.5,
  px: 1.25,
  py: 1,
  borderRadius: 3,
  justifyContent: "flex-start",
  textAlign: "left",
  transition: "background-color 160ms ease",
  "&:hover": { bgcolor: "action.hover" },
  "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main", outlineOffset: -2 },
};

const selectedSx = { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12), "&:hover": { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16) } };

const updatesCount = (count) => (count === 1 ? "1 update" : `${count} updates`);

const RowText = ({ title, detail, isStrong }) => (
  <Box sx={{ minWidth: 0, flex: 1 }}>
    <Typography noWrap sx={{ fontSize: 15, fontWeight: isStrong ? 800 : 700, letterSpacing: "-0.01em" }}>
      {title}
    </Typography>
    <Typography noWrap component="p" sx={{ m: 0, mt: 0.25, fontSize: 13, fontWeight: 500, color: "text.secondary" }}>
      {detail}
    </Typography>
  </Box>
);

const SectionLabel = ({ children }) => (
  <Typography component="h2" sx={{ px: 1.5, pt: 2.5, pb: 0.75, fontSize: 13, fontWeight: 700, color: "text.secondary" }}>
    {children}
  </Typography>
);

const PersonRow = ({ group, onOpen }) => (
  <Box component="li" sx={{ listStyle: "none" }}>
    <ButtonBase onClick={() => onOpen(group.owner._id)} sx={rowSx}>
      <ChatAvatar src={group.owner.avatar} name={group.owner.firstName} size={AVATAR_SIZE} statuses={group.statuses} />
      <RowText title={`${group.owner.firstName} ${group.owner.lastName}`} detail={ageOf(group.latestAt)} isStrong={group.hasUnseen} />
    </ButtonBase>
  </Box>
);

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
      <CircularProgress variant="determinate" value={Math.max(percent, MIN_VISIBLE_PERCENT)} size={AVATAR_SIZE + 10} thickness={2.5} sx={{ position: "absolute" }} />
      <ChatAvatar src={avatar} name={firstName} size={AVATAR_SIZE} />
    </Box>
  );
};

const MyStatusRow = ({ group, isSelected, onOpen, onCreate }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const posting = useSelector((state) => state.status.posting);
  const isEncryptionReady = useSelector((state) => state.encryption.status === "ready");
  const isPosting = posting !== null;

  const detail = () => {
    if (isPosting) return `Sharing, ${posting}%`;
    if (group) return `${updatesCount(group.statuses.length)}, latest ${ageOf(group.latestAt).toLowerCase()}`;
    return "Add an update";
  };

  return (
    <Box component="li" sx={{ listStyle: "none", position: "relative" }}>
      <ButtonBase
        onClick={(event) => (group ? onOpen() : onCreate(event.currentTarget))}
        disabled={isPosting || !isEncryptionReady}
        aria-current={isSelected ? "page" : undefined}
        sx={{ ...rowSx, ...(isSelected && selectedSx), pr: isPosting ? 7 : 1.25 }}
      >
        {isPosting ? <PostingAvatar percent={posting} /> : <ChatAvatar src={user.avatar} name={user.firstName} size={AVATAR_SIZE} statuses={group?.statuses} />}
        <RowText title="My status" detail={detail()} />
      </ButtonBase>
      {isPosting && (
        <Tooltip title="Stop sharing">
          <IconButton aria-label="Stop sharing" onClick={() => dispatch(CancelPosting())} sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
            <X size={20} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

const DiscoverRow = ({ unseenCount, isSelected, isWide, onOpen }) => (
  <Box component="li" sx={{ listStyle: "none" }}>
    <ButtonBase onClick={onOpen} aria-current={isSelected ? "page" : undefined} sx={{ ...rowSx, ...(isSelected && selectedSx) }}>
      <Box sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", color: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12) }}>
        <Compass size={24} weight="duotone" />
      </Box>
      <RowText title="Discover" detail="Updates shared with everyone" />
      {unseenCount > 0 && (
        <>
          <Box aria-hidden sx={{ minWidth: 22, height: 22, px: 0.75, borderRadius: 99, display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText", fontSize: 12, fontWeight: 800 }}>
            {unseenCount}
          </Box>
          <Box component="span" sx={SPOKEN_ONLY}>
            {unseenCount === 1 ? ", 1 person with new updates" : `, ${unseenCount} people with new updates`}
          </Box>
        </>
      )}
      {!isWide && <CaretRight size={16} weight="bold" />}
    </ButtonBase>
  </Box>
);

const SkeletonRows = () => (
  <Stack spacing={0.5} sx={{ px: 1.25, pt: 2.5 }} aria-hidden>
    {[0, 1, 2, 3].map((index) => (
      <Stack key={index} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
        <Skeleton variant="circular" width={AVATAR_SIZE} height={AVATAR_SIZE} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width={`${45 + ((index * 13) % 30)}%`} sx={{ borderRadius: 2 }} />
          <Skeleton width={`${20 + ((index * 7) % 15)}%`} sx={{ borderRadius: 2 }} />
        </Box>
      </Stack>
    ))}
  </Stack>
);

const StatusList = ({ myGroup, recent, viewed, discoverUnseen, selected, isWide, isLoading, onOpen, onOpenMine, onOpenDiscover, onWrite, onChooseMedia }) => {
  const isEncryptionReady = useSelector((state) => state.encryption.status === "ready");
  const isPosting = useSelector((state) => state.status.posting !== null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const hasFriendsUpdates = recent.length > 0 || viewed.length > 0;

  return (
    <Stack component="nav" aria-label="Status updates" sx={{ height: "100%", bgcolor: "chat.list" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ minHeight: 64, px: 2, py: 1.25 }}>
        <Typography component="h1" sx={{ m: 0 }}>
          <Wordmark name="Status" fontSize={30} />
        </Typography>
        <NewUpdateButton onOpen={setMenuAnchor} disabled={!isEncryptionReady || isPosting} />
      </Stack>

      <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 2 }}>
        <Box component="ul" sx={{ m: 0, p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          <MyStatusRow group={myGroup} isSelected={selected === "yours"} onOpen={onOpenMine} onCreate={setMenuAnchor} />
          <DiscoverRow unseenCount={discoverUnseen} isSelected={selected === "discover"} isWide={isWide} onOpen={onOpenDiscover} />
        </Box>

        {isLoading && !hasFriendsUpdates ? (
          <SkeletonRows />
        ) : (
          <>
            <PeopleSection label="Recent" groups={recent} onOpen={onOpen} />
            <PeopleSection label="Viewed" groups={viewed} onOpen={onOpen} />
            {!hasFriendsUpdates && (
              <Typography sx={{ mx: "auto", px: 3, py: 5, maxWidth: 280, fontSize: 14, fontWeight: 500, color: "text.secondary", textAlign: "center" }}>
                No updates from friends right now. When a friend shares one, it shows up here.
              </Typography>
            )}
          </>
        )}

        <Typography sx={{ px: 3, pt: 3, fontSize: 12, fontWeight: 500, color: "text.secondary", textAlign: "center", textWrap: "balance" }}>
          <LockSimple size={12} weight="bold" aria-hidden style={{ verticalAlign: "-1px", marginRight: 6 }} />
          Updates you share with friends are end-to-end encrypted
        </Typography>
      </Box>

      <NewUpdateMenu anchor={menuAnchor} onClose={() => setMenuAnchor(null)} onWrite={onWrite} onChooseMedia={onChooseMedia} />
    </Stack>
  );
};

export default StatusList;
