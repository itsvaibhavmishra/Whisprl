import { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Key, Trash } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { AddPasskey, GetPasskeys, LinkPasskey, RemovePasskey } from "@/redux/slices/actions/passkeyActions";
import { SettingRow } from "@/sections/settings/SettingsSection";
import { canUsePasskeys } from "@/utils/passkeys";

const dateOf = (value) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const ConfirmRemove = ({ onCancel, onConfirm }) => {
  const isRemoving = useIsLoading(RemovePasskey);

  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth="xs" aria-labelledby="remove-passkey-title" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle id="remove-passkey-title" sx={{ pb: 0.5 }}>
        Remove this passkey?
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 400 }}>
          It stops logging you in and unlocking your messages. Remove it from your device's passkeys too.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onCancel}>
          Cancel
        </Button>
        <LoadingButton color="error" variant="contained" loading={isRemoving} onClick={onConfirm}>
          Remove
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

const PasskeyRow = ({ passkey, canLink, onRemove }) => {
  const dispatch = useDispatch();
  const isLinking = useIsLoading(LinkPasskey, passkey.credentialId);
  const lastUsed = passkey.lastUsedAt ? `, last used ${dateOf(passkey.lastUsedAt)}` : "";

  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
      <Key size={20} aria-hidden="true" />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {passkey.backedUp ? "Synced passkey" : "Passkey on one device"}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Added {dateOf(passkey.createdAt)}
          {lastUsed}. {passkey.unlocksMessages ? "Unlocks your messages." : "Logs you in."}
        </Typography>
      </Box>
      {!passkey.unlocksMessages && canLink && (
        <LoadingButton size="small" loading={isLinking} onClick={() => dispatch(LinkPasskey(passkey.credentialId))}>
          Unlock messages too
        </LoadingButton>
      )}
      <Tooltip title="Remove passkey">
        <IconButton aria-label="Remove passkey" onClick={() => onRemove(passkey)}>
          <Trash size={18} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

const PasskeySetting = () => {
  const dispatch = useDispatch();
  const passkeys = useSelector((state) => state.user.passkeys);
  const isReady = useSelector((state) => state.encryption.status === "ready");
  const isAdding = useIsLoading(AddPasskey);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    dispatch(GetPasskeys());
  }, [dispatch]);

  const remove = async () => {
    await dispatch(RemovePasskey(removing._id));
    setRemoving(null);
  };

  const isSupported = canUsePasskeys();
  const description = isSupported
    ? "Log in without a password, and unlock your messages on a new browser."
    : "This browser cannot use passkeys, but you can still remove them here.";

  return (
    <Box>
      <SettingRow label="Passkeys" description={description}>
        {isSupported && (
          <LoadingButton variant="outlined" color="inherit" loading={isAdding} onClick={() => dispatch(AddPasskey())}>
            Add a passkey
          </LoadingButton>
        )}
      </SettingRow>
      {passkeys.length > 0 && (
        <Box sx={{ py: 1, borderBottom: 1, borderColor: "divider" }}>
          {passkeys.map((passkey) => (
            <PasskeyRow key={passkey._id} passkey={passkey} canLink={isReady && isSupported} onRemove={setRemoving} />
          ))}
        </Box>
      )}
      {removing && <ConfirmRemove onCancel={() => setRemoving(null)} onConfirm={remove} />}
    </Box>
  );
};

export default PasskeySetting;
