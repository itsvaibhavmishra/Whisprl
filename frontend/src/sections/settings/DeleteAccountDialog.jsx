import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { DeleteAccount, SendDeletionCode } from "@/redux/slices/actions/userActions";

const REASONS = [
  { value: "not-using", label: "I don't use Whisprl any more" },
  { value: "privacy", label: "I'm worried about my privacy" },
  { value: "unwanted-contact", label: "I'm getting messages I don't want" },
  { value: "another-account", label: "I have another account" },
  { value: "not-working", label: "Something isn't working" },
  { value: "other", label: "Something else" },
];
const MAX_NOTE = 500;
const CODE_LENGTH = 6;

const WHAT_GOES =
  "Your profile, username, friends, statuses and passkeys go, and you leave every group. People you chatted with keep their chats, with you shown as “Whisprl user”.";

const ReasonStep = ({ reason, onReason, note, onNote }) => (
  <>
    <DialogContentText>
      Your account is hidden as soon as you confirm, and deleted 14 days later. Log in before then and it comes back as it was.
    </DialogContentText>
    <DialogContentText sx={{ mt: 1.5 }}>{WHAT_GOES}</DialogContentText>
    <Typography id="delete-reason-label" sx={{ mt: 2.5, mb: 0.5, fontWeight: 600 }}>
      Why are you leaving?
    </Typography>
    <RadioGroup aria-labelledby="delete-reason-label" value={reason} onChange={(event) => onReason(event.target.value)}>
      {REASONS.map(({ value, label }) => (
        <FormControlLabel key={value} value={value} control={<Radio size="small" />} label={label} />
      ))}
    </RadioGroup>
    {reason === "other" && (
      <TextField
        label="Tell us why"
        value={note}
        onChange={(event) => onNote(event.target.value)}
        inputProps={{ maxLength: MAX_NOTE }}
        multiline
        minRows={2}
        fullWidth
        autoFocus
        sx={{ mt: 1.5 }}
      />
    )}
  </>
);

const CodeStep = ({ email, code, onCode, onResend, isResending }) => (
  <>
    <DialogContentText>
      Enter the {CODE_LENGTH}-digit code we emailed to <strong>{email}</strong>.
    </DialogContentText>
    <TextField
      label="Code"
      value={code}
      onChange={(event) => onCode(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
      inputProps={{ inputMode: "numeric", autoComplete: "one-time-code", maxLength: CODE_LENGTH, sx: { letterSpacing: "0.4em", fontWeight: 700 } }}
      fullWidth
      autoFocus
      sx={{ mt: 2.5 }}
    />
    <LoadingButton size="small" color="inherit" loading={isResending} onClick={onResend} sx={{ mt: 1, ml: -1 }}>
      Send a new code
    </LoadingButton>
    <Alert severity="warning" sx={{ mt: 2 }}>
      You&apos;ll be logged out everywhere and your account hidden now, then deleted in 14 days unless you log in again.
    </Alert>
  </>
);

const DeleteAccountDialog = ({ onClose }) => {
  const dispatch = useDispatch();
  const email = useSelector((state) => state.user.user.email);
  const isSending = useIsLoading(SendDeletionCode);
  const isDeleting = useIsLoading(DeleteAccount);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [hasCode, setHasCode] = useState(false);

  const isExplained = Boolean(reason) && (reason !== "other" || Boolean(note.trim()));

  const sendCode = async () => {
    const result = await dispatch(SendDeletionCode());
    if (SendDeletionCode.fulfilled.match(result)) setHasCode(true);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!hasCode) return sendCode();
    return dispatch(DeleteAccount({ reason, note: reason === "other" ? note.trim() : "", code }));
  };

  return (
    <Dialog open onClose={isDeleting ? undefined : onClose} fullWidth maxWidth="xs" aria-labelledby="delete-account-title">
      <form onSubmit={submit}>
        <DialogTitle id="delete-account-title">{hasCode ? "Confirm it's you" : "Delete your account?"}</DialogTitle>
        <DialogContent>
          {hasCode ? (
            <CodeStep email={email} code={code} onCode={setCode} onResend={sendCode} isResending={isSending} />
          ) : (
            <ReasonStep reason={reason} onReason={setReason} note={note} onNote={setNote} />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" disabled={isDeleting} onClick={hasCode ? () => setHasCode(false) : onClose}>
            {hasCode ? "Back" : "Cancel"}
          </Button>
          {hasCode ? (
            <LoadingButton type="submit" variant="contained" color="error" loading={isDeleting} disabled={code.length !== CODE_LENGTH}>
              Delete my account
            </LoadingButton>
          ) : (
            <LoadingButton type="submit" variant="contained" color="error" loading={isSending} disabled={!isExplained}>
              Email me a code
            </LoadingButton>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DeleteAccountDialog;
