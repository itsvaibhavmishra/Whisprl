import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import { CheckIcon, CopyIcon, DownloadSimpleIcon, KeyIcon } from "@phosphor-icons/react";

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
export const KEEP_RECOVERY_KEY = isApp ? { label: "Save to password manager", Icon: KeyIcon } : { label: "Download", Icon: DownloadSimpleIcon };

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

const RecoveryKeyBox = ({ recoveryKey, canCopy = false }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(recoveryKey);
    setIsCopied(true);
  };

  return (
    <Box
      sx={{
        position: "relative",
        py: 2,
        px: canCopy ? 6 : 1.5,
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
      {canCopy && (
        <IconButton
          aria-label={isCopied ? "Copied" : "Copy your recovery key"}
          onClick={copy}
          sx={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", color: isCopied ? "success.main" : "text.secondary" }}
        >
          {isCopied ? <CheckIcon size={20} weight="bold" /> : <CopyIcon size={20} />}
        </IconButton>
      )}
    </Box>
  );
};

export default RecoveryKeyBox;
