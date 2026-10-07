import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useDispatch } from "react-redux";

import { DeleteForEveryone, DeleteForMe } from "@/redux/slices/actions/messageActions";

const explanationOf = (message, canDeleteForEveryone) => {
  if (message.deletedAt) return "The note that it was deleted will be removed from your devices. Nobody else's chat changes.";
  if (canDeleteForEveryone) return "Delete for everyone leaves a note in the chat that it was deleted. Delete for me removes it only from your devices.";
  return "It will be removed from your devices. Everyone else in the chat still sees it.";
};

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
        <DialogContentText>{explanationOf(message, canDeleteForEveryone)}</DialogContentText>
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
