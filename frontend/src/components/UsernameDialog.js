import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment,
  TextField,
} from "@mui/material";
import { useDispatch } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { CheckUsername, UpdateUsername } from "@/redux/slices/actions/userActions";

const RENAME_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;
const CHECK_PAUSE_MS = 400;

const normalized = (value) => value.trim().replace(/^@/, "").toLowerCase();

export const nextChangeOn = (changedAt) => {
  if (!changedAt) return null;
  const next = new Date(new Date(changedAt).getTime() + RENAME_INTERVAL_MS);
  return next > new Date() ? next : null;
};

const UsernameDialog = ({ current, onClose }) => {
  const dispatch = useDispatch();
  const isSaving = useIsLoading(UpdateUsername);
  const [draft, setDraft] = useState(current);
  const [check, setCheck] = useState({ username: current, problem: null });

  const wanted = normalized(draft);
  const isChecked = check.username === wanted;
  const isFree = wanted !== current && isChecked && !check.problem;
  const canSave = isFree && !isSaving;

  // the server holds the rules and knows what is taken, so it is asked once typing pauses
  useEffect(() => {
    if (!wanted || wanted === current) return;
    const timer = setTimeout(async () => {
      const result = await dispatch(CheckUsername(wanted));
      if (CheckUsername.fulfilled.match(result)) setCheck(result.payload);
    }, CHECK_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [dispatch, wanted, current]);

  const helperText = () => {
    if (!wanted || wanted === current) return "Letters, numbers, dots and underscores.";
    if (!isChecked) return "Checking…";
    return check.problem ?? `@${wanted} is free`;
  };

  // the sheet renders in a portal yet still sits inside the page's own form in React's tree, so its submit stops here
  const save = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = await dispatch(UpdateUsername(wanted));
    if (UpdateUsername.fulfilled.match(result)) onClose();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" aria-labelledby="username-title">
      <form onSubmit={save}>
        <DialogTitle id="username-title">Change your username</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            People can find you by it. You can change it once every 30 days.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Username"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            error={isChecked && Boolean(check.problem)}
            helperText={helperText()}
            FormHelperTextProps={{ sx: { color: isFree ? "success.main" : undefined } }}
            inputProps={{ maxLength: 21, autoCapitalize: "none", spellCheck: false }}
            InputProps={{ startAdornment: <InputAdornment position="start">@</InputAdornment> }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!canSave}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UsernameDialog;
