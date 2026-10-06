import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useDispatch } from "react-redux";

import { DeleteForEveryone, DeleteForMe } from "@/redux/slices/actions/messageActions";

const DeleteMessageDialog = ({ message, canDeleteForEveryone, open, onClose }) => {
  const dispatch = useDispatch();

  const remove = (thunk) => {
    dispatch(thunk(message));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="delete-message-title">
      <DialogTitle id="delete-message-title">Delete message?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {canDeleteForEveryone
            ? "Delete for everyone leaves a note in the chat that it was deleted. Delete for me removes it only from your devices."
            : "It will be removed from your devices. Everyone else in the chat still sees it."}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => remove(DeleteForMe)}>Delete for me</Button>
        {canDeleteForEveryone && (
          <Button color="error" variant="contained" onClick={() => remove(DeleteForEveryone)}>
            Delete for everyone
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DeleteMessageDialog;
