import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Checkbox, Collapse, FormControlLabel, Link, Skeleton, Stack, Typography } from "@mui/material";
import { CaretDownIcon, CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { CreateAccountKey, PrepareEncryption, ReplaceRecoveryKey } from "@/redux/slices/actions/encryptionActions";
import { ConfirmRecoveryKeySaved } from "@/redux/slices/actions/onboardingActions";
import RecoveryKeyBox, { KEEP_RECOVERY_KEY, keepRecoveryKey } from "@/sections/encryption/RecoveryKeyBox";
import UnlockDialog from "@/sections/encryption/UnlockDialog";
import { deviceNoun, isApp } from "@/utils/platform";

const WHERE_TO_KEEP_IT = [
  { place: "A password app", how: "as a secure note in iCloud Keychain, Google Password Manager, 1Password or Bitwarden" },
  { place: "A file", how: "moved out of Downloads to somewhere backed up, like iCloud Drive or Google Drive", isWebOnly: true },
  { place: "On paper", how: "kept with your important papers, never in shared photos or notes" },
].filter((keeping) => !(isApp && keeping.isWebOnly));

// folded away so the screen holds only the key and what to do with it, for whoever wants the detail
const KeepingPlaces = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box>
      <Link
        component="button"
        type="button"
        variant="body2"
        underline="hover"
        aria-expanded={isOpen}
        aria-controls="keeping-places"
        onClick={() => setIsOpen(!isOpen)}
        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontWeight: 600 }}
      >
        Where to keep it
        <CaretDownIcon size={14} weight="bold" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }} />
      </Link>
      <Collapse in={isOpen} id="keeping-places">
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
        {isApp && (
          <Typography variant="body2" sx={{ mt: 1.5, color: "text.secondary" }}>
            This phone also keeps your key, so reinstalling Whisprl won&apos;t lock your messages while your Google backup is on. Your recovery key is for
            everywhere else.
          </Typography>
        )}
      </Collapse>
    </Box>
  );
};

const BEFORE_THE_KEY = {
  setup: `Whisprl makes the key that locks your messages, and a recovery key that opens them on a new ${deviceNoun}.`,
  ready: `Whisprl makes you a new recovery key that opens your messages on a new ${deviceNoun}. Any old one stops working, and your messages stay as they are.`,
  locked: `This ${deviceNoun} hasn't opened your messages yet. Unlock them first, then save a new recovery key.`,
  failed: "Whisprl couldn't check your messages. Try again.",
};

const SavedKey = ({ recoveryKey }) => {
  const dispatch = useDispatch();
  const username = useSelector((state) => state.user.user.username);
  const isConfirming = useIsLoading(ConfirmRecoveryKeySaved);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const keep = async () => {
    if (await keepRecoveryKey(recoveryKey, username)) setIsSaved(true);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(recoveryKey);
    setIsCopied(true);
  };

  return (
    <Stack spacing={2.5}>
      <Stack spacing={1}>
        <RecoveryKeyBox recoveryKey={recoveryKey} />
        <Button color="inherit" startIcon={isCopied ? <CheckIcon /> : <CopyIcon />} onClick={copy} sx={{ alignSelf: "flex-start" }}>
          {isCopied ? "Copied" : "Copy"}
        </Button>
      </Stack>
      <Alert severity="warning">
        If you lose this key, and no passkey unlocks your messages, you can&apos;t open them on a new {deviceNoun}. Whisprl can&apos;t recover it for you.
      </Alert>
      <KeepingPlaces />
      <Stack spacing={1.5}>
        <Button
          size="large"
          fullWidth
          variant={isSaved ? "outlined" : "contained"}
          color={isSaved ? "inherit" : "primary"}
          startIcon={<KEEP_RECOVERY_KEY.Icon />}
          onClick={keep}
        >
          {KEEP_RECOVERY_KEY.label}
        </Button>
        <FormControlLabel
          sx={{ alignItems: "flex-start" }}
          control={<Checkbox checked={isSaved} onChange={(event) => setIsSaved(event.target.checked)} sx={{ mt: -0.75 }} />}
          label={<Typography variant="body2">I have saved my recovery key somewhere safe</Typography>}
        />
        <Button
          size="large"
          fullWidth
          variant={isSaved ? "contained" : "outlined"}
          color={isSaved ? "primary" : "inherit"}
          disabled={!isSaved}
          loading={isConfirming}
          onClick={() => dispatch(ConfirmRecoveryKeySaved())}
        >
          Continue
        </Button>
      </Stack>
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

  const makeKey = useCallback(
    async (thunk) => {
      const result = await dispatch(thunk());
      if (thunk.fulfilled.match(result)) setRecoveryKey(result.payload.recoveryKey);
    },
    [dispatch]
  );

  // a new account has no key to replace, so there is nothing to ask before making it
  useEffect(() => {
    dispatch(PrepareEncryption()).then(({ payload }) => {
      if (payload?.status === "setup") makeKey(CreateAccountKey);
    });
  }, [dispatch, makeKey]);

  const isMakingKey = status === "checking" || (status === "setup" && isCreating);

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
      {recoveryKey && <SavedKey recoveryKey={recoveryKey} />}
      {!recoveryKey && isMakingKey && <Skeleton variant="rounded" height={58} aria-label="Making your recovery key" />}
      {!recoveryKey && !isMakingKey && (
        <Button size="large" variant="contained" fullWidth loading={isCreating || isReplacing} onClick={action.run}>
          {action.label}
        </Button>
      )}
      {isUnlocking && status === "locked" && <UnlockDialog onStartFresh={startFresh} />}
    </Stack>
  );
};

export default ProtectMessagesStep;
