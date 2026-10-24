import { useEffect, useState } from "react";
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";

import { deviceNoun } from "@/utils/platform";

const WAIT_SECONDS = 5;

const CopiedKeyDialog = ({ isContinuing, onBack, onContinue }) => {
  const [secondsLeft, setSecondsLeft] = useState(WAIT_SECONDS);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!secondsLeft) return undefined;
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <Dialog
      open
      onClose={onBack}
      fullWidth
      maxWidth="xs"
      aria-labelledby="copied-key-title"
      aria-describedby="copied-key-description"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle id="copied-key-title" sx={{ pb: 0.5 }}>
        Is your recovery key saved?
      </DialogTitle>
      <DialogContent>
        <Typography id="copied-key-description" variant="body2" sx={{ color: "text.secondary", fontWeight: 400, mb: 2 }}>
          Copying only puts it on your clipboard, and the next thing you copy replaces it. If you lose this key, you can&apos;t open your messages on a new{" "}
          {deviceNoun}, and Whisprl can&apos;t recover it for you.
        </Typography>
        <FormControlLabel
          sx={{ alignItems: "flex-start" }}
          control={<Checkbox checked={isSaved} onChange={(event) => setIsSaved(event.target.checked)} sx={{ mt: -0.75 }} />}
          label={<Typography variant="body2">I&apos;ve saved my recovery key somewhere safe</Typography>}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onBack}>
          Go back
        </Button>
        <LoadingButton variant="contained" disabled={!isSaved || secondsLeft > 0} loading={isContinuing} onClick={onContinue}>
          {secondsLeft ? `Continue in ${secondsLeft}` : "Continue"}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default CopiedKeyDialog;
