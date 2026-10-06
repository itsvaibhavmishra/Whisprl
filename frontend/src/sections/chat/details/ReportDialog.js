import { useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { useDispatch } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { BlockUser, ReportChat } from "@/redux/slices/actions/chatSettingsActions";
import { notify } from "@/utils/notify";

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "impersonation", label: "Pretending to be someone else" },
  { value: "other", label: "Something else" },
];
const MAX_NOTE = 500;

// a person can be reported and blocked in one go; a group is reported as a whole
const ReportDialog = ({ conversation, person, onClose }) => {
  const dispatch = useDispatch();
  const isSending = useIsLoading(ReportChat);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const subject = person ? person.firstName : conversation.name;

  const send = async (event) => {
    event.preventDefault();
    const result = await dispatch(ReportChat({ conversationId: conversation._id, userId: person?._id, reason, note: note.trim() }));
    if (!ReportChat.fulfilled.match(result)) return;
    if (alsoBlock) await dispatch(BlockUser(person));
    notify({ severity: "success", message: "Thanks, your report was sent" });
    onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="report-title">
      <form onSubmit={send}>
        <DialogTitle id="report-title">Report {subject}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            Messages stay end-to-end encrypted, so the report holds only what you tell us here.
          </DialogContentText>
          <RadioGroup aria-label="Why are you reporting this?" value={reason} onChange={(event) => setReason(event.target.value)}>
            {REASONS.map(({ value, label }) => (
              <FormControlLabel key={value} value={value} control={<Radio size="small" />} label={label} />
            ))}
          </RadioGroup>
          <TextField
            label="Anything else we should know (optional)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            inputProps={{ maxLength: MAX_NOTE }}
            multiline
            minRows={2}
            fullWidth
            sx={{ mt: 1.5 }}
          />
          {person && (
            <FormControlLabel
              control={<Checkbox checked={alsoBlock} onChange={(event) => setAlsoBlock(event.target.checked)} />}
              label={`Also block ${person.firstName}`}
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" color="error" variant="contained" disabled={!reason || isSending}>
            Report
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReportDialog;
