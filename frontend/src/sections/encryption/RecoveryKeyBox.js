import { Box } from "@mui/material";
import { DownloadSimple, Key } from "phosphor-react";

import { saveToPasswordManager } from "@/utils/crypto/keyVault";
import { notify } from "@/utils/notify";
import { isApp } from "@/utils/platform";

const downloadRecoveryKey = (recoveryKey) => {
  const text = `Whisprl recovery key\n\n${recoveryKey}\n\nUse it to open your messages on a new browser. Keep it private.\n`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  link.download = "whisprl-recovery-key.txt";
  link.click();
  URL.revokeObjectURL(link.href);
};

// the app's web view drops downloads without a word, so there the key goes to the phone's password manager
export const KEEP_RECOVERY_KEY = isApp ? { label: "Save to password manager", Icon: Key } : { label: "Download", Icon: DownloadSimple };

const NO_PASSWORD_MANAGER = "This phone has nowhere to save passwords. Copy your recovery key instead, or write it down.";

export const keepRecoveryKey = async (recoveryKey, username) => {
  if (!isApp) {
    downloadRecoveryKey(recoveryKey);
    return true;
  }
  const outcome = await saveToPasswordManager(`${username} recovery key`, recoveryKey);
  if (outcome === "failed") notify({ severity: "error", message: NO_PASSWORD_MANAGER });
  return outcome === "saved";
};

const RecoveryKeyBox = ({ recoveryKey }) => (
  <Box
    sx={{
      py: 2,
      px: 1.5,
      borderRadius: 2,
      bgcolor: "action.hover",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: { xs: 15, sm: 19 },
      fontWeight: 600,
      letterSpacing: "0.06em",
      textAlign: "center",
      userSelect: "all",
      overflowWrap: "anywhere",
    }}
  >
    {recoveryKey}
  </Box>
);

export default RecoveryKeyBox;
