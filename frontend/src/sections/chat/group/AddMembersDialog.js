import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { useDispatch } from "react-redux";

import { AddGroupMembers } from "@/redux/slices/actions/groupActions";
import FriendPicker from "@/components/FriendPicker";
import useIsLoading from "@/hooks/useIsLoading";
import { MAX_GROUP_SIZE } from "@/utils/groups";

const AddMembersDialog = ({ group, open, onClose }) => {
  const dispatch = useDispatch();
  const isAdding = useIsLoading(AddGroupMembers);
  const [memberIds, setMemberIds] = useState([]);
  const room = MAX_GROUP_SIZE - group.users.length;

  const close = () => {
    setMemberIds([]);
    onClose();
  };

  const add = async () => {
    const result = await dispatch(AddGroupMembers({ groupId: group._id, memberIds }));
    if (AddGroupMembers.fulfilled.match(result)) close();
  };

  const label = () => {
    if (memberIds.length > room) return `Only ${room} more can join`;
    return memberIds.length ? `Add ${memberIds.length}` : "Add";
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs" aria-labelledby="add-members-title">
      <DialogTitle id="add-members-title">Add people</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FriendPicker
            excludeIds={group.users.map((member) => member._id)}
            selected={memberIds}
            onChange={setMemberIds}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={close}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={add}
          disabled={!memberIds.length || memberIds.length > room || isAdding}
        >
          {label()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddMembersDialog;
