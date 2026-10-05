import { useState } from "react";
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Typography } from "@mui/material";
import { Check, Copy, DownloadSimple } from "phosphor-react";

const downloadAsFile = (recoveryKey) => {
  const text = `Whisprl recovery key\n\n${recoveryKey}\n\nUse it to open your messages on a new browser. Keep it private.\n`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  link.download = "whisprl-recovery-key.txt";
  link.click();
  URL.revokeObjectURL(link.href);
};

const RecoveryKeyDialog = ({ recoveryKey, title = "Save your recovery key", onDone }) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
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
          Your messages are end-to-end encrypted, so only you and your friends can read them. On a new browser, this key
          opens them. Whisprl cannot see it or recover it for you.
        </Typography>

        <Box
          sx={{
            mt: 3,
            py: 2,
            px: 1.5,
            borderRadius: 2,
            bgcolor: "action.hover",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: { xs: 17, sm: 19 },
            fontWeight: 600,
            letterSpacing: "0.06em",
            textAlign: "center",
            userSelect: "all",
            overflowWrap: "anywhere",
          }}
        >
          {recoveryKey}
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button color="inherit" startIcon={copied ? <Check /> : <Copy />} onClick={copy}>
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button color="inherit" startIcon={<DownloadSimple />} onClick={() => downloadAsFile(recoveryKey)}>
            Download
          </Button>
        </Stack>

        <FormControlLabel
          sx={{ mt: 2, alignItems: "flex-start" }}
          control={<Checkbox checked={saved} onChange={(event) => setSaved(event.target.checked)} sx={{ mt: -0.75 }} />}
          label={<Typography variant="body2">I have saved my recovery key somewhere safe</Typography>}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="contained" disabled={!saved} onClick={onDone}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecoveryKeyDialog;
