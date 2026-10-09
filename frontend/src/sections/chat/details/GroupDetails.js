import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { PencilSimple, SignOut, UserPlus } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import ImageMenu from "@/components/ImageMenu";
import { LeaveGroup, UpdateGroup } from "@/redux/slices/actions/groupActions";
import AddMembersDialog from "@/sections/chat/group/AddMembersDialog";
import GroupMemberRow from "@/sections/chat/group/GroupMemberRow";
import ControlRow from "@/components/ControlRow";
import { DetailsSection } from "@/sections/chat/details/DetailsSection";
import HaloAvatar from "@/sections/chat/details/HaloAvatar";
import useIsLoading from "@/hooks/useIsLoading";
import { MAX_GROUP_NAME, MAX_GROUP_SIZE, canManage, isAdminOf, isOwnerOf, membersLabel } from "@/utils/groups";

const rankOf = (group, userId) => {
  if (isOwnerOf(group, userId)) return 0;
  return isAdminOf(group, userId) ? 1 : 2;
};

const leavingNoteFor = (group, meId) => {
  if (group.users.length === 1) return "You are the last member, so the group and its messages will be deleted.";
  if (isOwnerOf(group, meId)) return "The longest-standing admin will own the group, or the longest-standing member if there are no admins.";
  return "You will stop getting its messages. An admin can add you back later.";
};

const GroupName = ({ group, canRename }) => {
  const dispatch = useDispatch();
  const isSaving = useIsLoading(UpdateGroup);
  const [draft, setDraft] = useState(null);

  const save = async (event) => {
    event.preventDefault();
    const result = await dispatch(UpdateGroup({ groupId: group._id, name: draft.trim() }));
    if (UpdateGroup.fulfilled.match(result)) setDraft(null);
  };

  if (draft === null) {
    return (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography sx={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25, wordBreak: "break-word", textAlign: "center" }}>
          {group.name}
        </Typography>
        {canRename && (
          <IconButton size="small" aria-label="Rename group" onClick={() => setDraft(group.name)}>
            <PencilSimple />
          </IconButton>
        )}
      </Stack>
    );
  }

  return (
    <Stack component="form" onSubmit={save} spacing={1} sx={{ width: "100%" }}>
      <TextField
        size="small"
        label="Group name"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        inputProps={{ maxLength: MAX_GROUP_NAME }}
        autoFocus
        fullWidth
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button size="small" color="inherit" onClick={() => setDraft(null)}>
          Cancel
        </Button>
        <Button
          size="small"
          type="submit"
          variant="contained"
          disabled={!draft.trim() || draft.trim() === group.name || isSaving}
        >
          Save
        </Button>
      </Stack>
    </Stack>
  );
};

const GroupDetails = ({ group, sharedContent, quickActions }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const isLeaving = useIsLoading(LeaveGroup);
  const [isAdding, setIsAdding] = useState(false);
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false);

  const isManager = canManage(group, meId);
  const members = [...group.users].sort(
    (first, second) => rankOf(group, first._id) - rankOf(group, second._id) || first.firstName.localeCompare(second.firstName)
  );

  const changePicture = async (picture) => {
    await dispatch(UpdateGroup({ groupId: group._id, picture }));
    if (picture) URL.revokeObjectURL(picture);
  };

  return (
    <>
      <Stack alignItems="center" spacing={0.5} sx={{ px: 3, pt: 3.5, pb: 2.5 }}>
        <Box sx={{ mb: 1.5 }}>
          <HaloAvatar src={group.picture} name={group.name}>
            {isManager && (
              <Box sx={{ position: "absolute", right: 0, bottom: 0 }}>
                <ImageMenu kind="group" hasImage={!!group.picture} onChange={changePicture} />
              </Box>
            )}
          </HaloAvatar>
        </Box>
        <GroupName group={group} canRename={isManager} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary" }}>{membersLabel(group)}</Typography>
      </Stack>

      {quickActions}
      {sharedContent}

      <DetailsSection
        title="Members"
        action={
          isManager &&
          group.users.length < MAX_GROUP_SIZE && (
            <Button size="small" startIcon={<UserPlus weight="bold" />} onClick={() => setIsAdding(true)} sx={{ borderRadius: 99 }}>
              Add people
            </Button>
          )
        }
      >
        <List disablePadding>
          {members.map((member) => (
            <GroupMemberRow key={member._id} group={group} member={member} meId={meId} />
          ))}
        </List>
      </DetailsSection>

      <Box sx={{ px: 1, pt: 1.5 }}>
        <ControlRow icon={SignOut} label="Leave group" isDanger onClick={() => setIsConfirmingLeave(true)} />
      </Box>

      {isManager && <AddMembersDialog group={group} open={isAdding} onClose={() => setIsAdding(false)} />}

      <Dialog open={isConfirmingLeave} onClose={() => setIsConfirmingLeave(false)} aria-labelledby="leave-group-title">
        <DialogTitle id="leave-group-title">Leave {group.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>{leavingNoteFor(group, meId)}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setIsConfirmingLeave(false)}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={isLeaving}
            onClick={() => dispatch(LeaveGroup({ groupId: group._id, userId: meId }))}
          >
            Leave group
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GroupDetails;
