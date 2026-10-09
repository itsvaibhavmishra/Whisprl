import { useEffect, useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Check, Copy, DownloadSimple } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { CreateAccountKey, PrepareEncryption, ReplaceRecoveryKey } from "@/redux/slices/actions/encryptionActions";
import { ConfirmRecoveryKeySaved } from "@/redux/slices/actions/onboardingActions";
import RecoveryKeyBox, { downloadRecoveryKey } from "@/sections/encryption/RecoveryKeyBox";
import UnlockDialog from "@/sections/encryption/UnlockDialog";

const WHERE_TO_KEEP_IT = [
  { place: "A password app", how: "as a secure note in iCloud Keychain, Google Password Manager, 1Password or Bitwarden" },
  { place: "A file", how: "moved out of Downloads to somewhere backed up, like iCloud Drive or Google Drive" },
  { place: "On paper", how: "kept with your important papers, never in shared photos or notes" },
];

const KeepingPlaces = () => (
  <Box component="section" aria-labelledby="keeping-places-title">
    <Typography id="keeping-places-title" component="h3" sx={{ m: 0, fontSize: 14, fontWeight: 700 }}>
      Where to keep it
    </Typography>
    <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, display: "grid", gap: 0.75 }}>
      {WHERE_TO_KEEP_IT.map(({ place, how }) => (
        <Typography key={place} component="li" variant="body2" sx={{ color: "text.secondary" }}>
          <Box component="strong" sx={{ color: "text.primary", fontWeight: 600 }}>
            {place}
          </Box>
          , {how}.
        </Typography>
      ))}
    </Box>
  </Box>
);

const BEFORE_THE_KEY = {
  setup: "Whisprl makes the key that locks your messages, and a recovery key that opens them on a new browser.",
  ready: "Whisprl makes you a new recovery key that opens your messages on a new browser. Any old one stops working, and your messages stay as they are.",
  locked: "This browser hasn't opened your messages yet. Unlock them first, then save a new recovery key.",
  failed: "Whisprl couldn't check your messages. Try again.",
};

const SavedKey = ({ recoveryKey }) => {
  const dispatch = useDispatch();
  const isConfirming = useIsLoading(ConfirmRecoveryKeySaved);
  const [isKept, setIsKept] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const download = () => {
    downloadRecoveryKey(recoveryKey);
    setIsKept(true);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(recoveryKey);
    setIsCopied(true);
    setIsKept(true);
  };

  return (
    <Stack spacing={2.5}>
      <RecoveryKeyBox recoveryKey={recoveryKey} />
      <Stack direction="row" spacing={1}>
        <Button variant="contained" startIcon={<DownloadSimple />} onClick={download} sx={{ flex: 1 }}>
          Download
        </Button>
        <Button variant="outlined" color="inherit" startIcon={isCopied ? <Check /> : <Copy />} onClick={copy} sx={{ flex: 1 }}>
          {isCopied ? "Copied" : "Copy"}
        </Button>
      </Stack>
      <Alert severity="warning">
        If you lose this key, and no passkey unlocks your messages, you can&apos;t open them on a new browser. Whisprl can&apos;t recover it for
        you.
      </Alert>
      <KeepingPlaces />
      <LoadingButton size="large" variant="contained" fullWidth disabled={!isKept} loading={isConfirming} onClick={() => dispatch(ConfirmRecoveryKeySaved())}>
        Continue
      </LoadingButton>
    </Stack>
  );
};

const ProtectMessagesStep = () => {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.encryption.status);
  const isCreating = useIsLoading(CreateAccountKey);
  const isReplacing = useIsLoading(ReplaceRecoveryKey);
  const [recoveryKey, setRecoveryKey] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    dispatch(PrepareEncryption());
  }, [dispatch]);

  const makeKey = async (thunk) => {
    const result = await dispatch(thunk());
    if (thunk.fulfilled.match(result)) setRecoveryKey(result.payload.recoveryKey);
  };

  const startFresh = async () => {
    await makeKey(CreateAccountKey);
    setIsUnlocking(false);
  };

  // a browser that already holds the key gets a new recovery key, since nothing shows the old one was ever saved
  const action = {
    setup: { label: "Make my recovery key", run: () => makeKey(CreateAccountKey) },
    ready: { label: "Make my recovery key", run: () => makeKey(ReplaceRecoveryKey) },
    locked: { label: "Unlock my messages", run: () => setIsUnlocking(true) },
    failed: { label: "Try again", run: () => dispatch(PrepareEncryption()) },
  }[status];

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography component="h2" sx={{ m: 0, fontSize: 20, fontWeight: 700 }}>
          Protect your messages
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Your messages are end-to-end encrypted, so only you and your friends can read them. {!recoveryKey && BEFORE_THE_KEY[status]}
        </Typography>
      </Stack>
      {recoveryKey ? (
        <SavedKey recoveryKey={recoveryKey} />
      ) : (
        <LoadingButton size="large" variant="contained" fullWidth loading={!action || isCreating || isReplacing} onClick={action?.run}>
          {action?.label ?? "Make my recovery key"}
        </LoadingButton>
      )}
      {isUnlocking && status === "locked" && <UnlockDialog onStartFresh={startFresh} />}
    </Stack>
  );
};

export default ProtectMessagesStep;
