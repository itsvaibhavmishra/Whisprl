import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useDispatch, useSelector } from "react-redux";

import { ReplaceRecoveryKey } from "@/redux/slices/actions/encryptionActions";
import RecoveryKeyDialog from "@/sections/encryption/RecoveryKeyDialog";
import { SettingRow } from "@/sections/settings/SettingsSection";

const ConfirmNewKey = ({ onCancel, onConfirm }) => {
  const [making, setMaking] = useState(false);

  const confirm = async () => {
    setMaking(true);
    await onConfirm();
    setMaking(false);
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      fullWidth
      maxWidth="xs"
      aria-labelledby="new-recovery-key-title"
      aria-describedby="new-recovery-key-description"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle id="new-recovery-key-title" sx={{ pb: 0.5 }}>
        Make a new recovery key?
      </DialogTitle>
      <DialogContent>
        <Typography id="new-recovery-key-description" variant="body2" sx={{ color: "text.secondary", fontWeight: 400 }}>
          Your old recovery key stops working. Browsers that are already unlocked stay unlocked.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onCancel}>
          Cancel
        </Button>
        <LoadingButton variant="contained" loading={making} onClick={confirm}>
          Make a new key
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

const RecoveryKeySetting = () => {
  const dispatch = useDispatch();
  const isReady = useSelector((state) => state.encryption.status === "ready");
  const [confirming, setConfirming] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState(null);

  const makeNewKey = async () => {
    const result = await dispatch(ReplaceRecoveryKey());
    setConfirming(false);
    if (ReplaceRecoveryKey.fulfilled.match(result)) setRecoveryKey(result.payload.recoveryKey);
  };

  return (
    <SettingRow label="Recovery key" description="Opens your encrypted messages on a new browser. Lost it? Make a new one.">
      <Button variant="outlined" color="inherit" disabled={!isReady} onClick={() => setConfirming(true)}>
        Make a new key
      </Button>
      {confirming && <ConfirmNewKey onCancel={() => setConfirming(false)} onConfirm={makeNewKey} />}
      {recoveryKey && (
        <RecoveryKeyDialog title="Save your new recovery key" recoveryKey={recoveryKey} onDone={() => setRecoveryKey(null)} />
      )}
    </SettingRow>
  );
};

export default RecoveryKeySetting;
