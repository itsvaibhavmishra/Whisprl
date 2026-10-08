import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useDispatch } from "react-redux";

import FriendPicker from "@/components/FriendPicker";
import { ShareStatus } from "@/redux/slices/actions/statusActions";
import { notify } from "@/utils/notify";

const MAX_MESSAGE = 1000;

const ShareStatusDialog = ({ status, onClose }) => {
  const dispatch = useDispatch();
  const [chosen, setChosen] = useState([]);
  const [text, setText] = useState("");

  const send = () => {
    dispatch(ShareStatus({ status, friendIds: chosen, text: text.trim() }));
    notify({ severity: "success", message: chosen.length === 1 ? "Sent to 1 friend" : `Sent to ${chosen.length} friends` });
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="share-status-title">
      <DialogTitle id="share-status-title">Send to friends</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <FriendPicker selected={chosen} onChange={setChosen} excludeIds={[status.owner._id]} emptyLabel="You have no friends to send it to yet" />
          <TextField
            label="Add a message"
            value={text}
            onChange={(event) => setText(event.target.value)}
            inputProps={{ maxLength: MAX_MESSAGE }}
            multiline
            maxRows={4}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={send} disabled={!chosen.length}>
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareStatusDialog;
