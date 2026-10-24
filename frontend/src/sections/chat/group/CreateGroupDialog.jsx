import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useDispatch } from "react-redux";

import { CreateGroup } from "@/redux/slices/actions/groupActions";
import FriendPicker from "@/components/FriendPicker";
import useIsLoading from "@/hooks/useIsLoading";
import { MAX_GROUP_NAME } from "@/utils/groups";

const MIN_FRIENDS = 2;

const CreateGroupDialog = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const isCreating = useIsLoading(CreateGroup);
  const [name, setName] = useState("");
  const [memberIds, setMemberIds] = useState([]);

  const close = () => {
    setName("");
    setMemberIds([]);
    onClose();
  };

  const create = async (event) => {
    event.preventDefault();
    const result = await dispatch(CreateGroup({ name: name.trim(), memberIds }));
    if (CreateGroup.fulfilled.match(result)) close();
  };

  const missingFriends = MIN_FRIENDS - memberIds.length;
  const canCreate = name.trim() && missingFriends <= 0 && !isCreating;

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs" aria-labelledby="create-group-title">
      <form onSubmit={create}>
        <DialogTitle id="create-group-title">New group</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Group name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              inputProps={{ maxLength: MAX_GROUP_NAME }}
              autoFocus
              fullWidth
            />
            <FriendPicker selected={memberIds} onChange={setMemberIds} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!canCreate}>
            {missingFriends > 0 ? `Pick ${missingFriends} more friend${missingFriends === 1 ? "" : "s"}` : "Create group"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateGroupDialog;
