import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useDispatch } from "react-redux";

import { DeleteForEveryone, DeleteForMe } from "@/redux/slices/actions/messageActions";

const NOUNS = { image: "photo", video: "video" };

const titleOf = (messages) => {
  const nouns = new Set(messages.map((message) => NOUNS[message.file?.kind] ?? "message"));
  const noun = nouns.size === 1 ? [...nouns][0] : "item";
  return messages.length === 1 ? `Delete ${noun}?` : `Delete ${messages.length} ${noun}s?`;
};

const explanationOf = (message, canDeleteForEveryone) => {
  if (message.deletedAt) return "The note that it was deleted will be removed from your devices. Nobody else's chat changes.";
  if (canDeleteForEveryone) return "Delete for everyone leaves a note in the chat that it was deleted. Delete for me removes it only from your devices.";
  return "It will be removed from your devices. Everyone else in the chat still sees it.";
};

// onChosen lets what opened the dialog step aside first, as a viewer closes before the photo it shows goes
const DeleteMessageDialog = ({ messages, canDeleteForEveryone, open, onClose, onChosen }) => {
  const dispatch = useDispatch();

  const remove = async (thunk) => {
    onClose();
    await onChosen?.();
    messages.forEach((message) => dispatch(thunk(message)));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="delete-message-title">
      <DialogTitle id="delete-message-title">{titleOf(messages)}</DialogTitle>
      <DialogContent>
        <DialogContentText>{explanationOf(messages[0], canDeleteForEveryone)}</DialogContentText>
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
