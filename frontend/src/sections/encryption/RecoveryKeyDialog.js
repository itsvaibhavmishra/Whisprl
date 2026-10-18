import { useState } from "react";
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Typography } from "@mui/material";
import { Check, Copy } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { ConfirmRecoveryKeySaved } from "@/redux/slices/actions/onboardingActions";
import RecoveryKeyBox, { KEEP_RECOVERY_KEY, keepRecoveryKey } from "@/sections/encryption/RecoveryKeyBox";
import { deviceNoun } from "@/utils/platform";

const RecoveryKeyDialog = ({ recoveryKey, title = "Save your recovery key", onDone }) => {
  const dispatch = useDispatch();
  const username = useSelector((state) => state.user.user.username);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
  };

  const done = () => {
    dispatch(ConfirmRecoveryKeySaved());
    onDone();
  };

  return (
    <Dialog
      open
      fullWidth
      maxWidth="xs"
      aria-labelledby="recovery-key-title"
      aria-describedby="recovery-key-description"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle id="recovery-key-title" sx={{ pb: 0.5 }}>
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography id="recovery-key-description" variant="body2" sx={{ color: "text.secondary", fontWeight: 400 }}>
          Your messages are end-to-end encrypted, so only you and your friends can read them. On a new {deviceNoun}, this key
          opens them. Whisprl cannot see it or recover it for you.
        </Typography>

        <Box sx={{ mt: 3 }}>
          <RecoveryKeyBox recoveryKey={recoveryKey} />
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button color="inherit" startIcon={copied ? <Check /> : <Copy />} onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button color="inherit" startIcon={<KEEP_RECOVERY_KEY.Icon />} onClick={() => keepRecoveryKey(recoveryKey, username)}>
            {KEEP_RECOVERY_KEY.label}
          </Button>
        </Stack>

        <FormControlLabel
          sx={{ mt: 2, alignItems: "flex-start" }}
          control={<Checkbox checked={saved} onChange={(event) => setSaved(event.target.checked)} sx={{ mt: -0.75 }} />}
          label={<Typography variant="body2">I have saved my recovery key somewhere safe</Typography>}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="contained" disabled={!saved} onClick={done}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecoveryKeyDialog;
