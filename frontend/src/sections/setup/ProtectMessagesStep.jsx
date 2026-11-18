import { useCallback, useEffect, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, Skeleton, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import protectMessages from "@/assets/setup/protect-messages.webp";
import useIsLoading from "@/hooks/useIsLoading";
import { CreateAccountKey, PrepareEncryption, ReplaceRecoveryKey } from "@/redux/slices/actions/encryptionActions";
import { ConfirmRecoveryKeySaved } from "@/redux/slices/actions/onboardingActions";
import RecoveryKeyBox, { KEEP_RECOVERY_KEY, keepRecoveryKey } from "@/sections/encryption/RecoveryKeyBox";
import UnlockDialog from "@/sections/encryption/UnlockDialog";
import { deviceNoun } from "@/utils/platform";

const KEY_LEAD = `It opens your messages on a new ${deviceNoun}. Only you have it.`;

const BEFORE_THE_KEY = {
  setup: `Whisprl is making the key that opens your messages on a new ${deviceNoun}.`,
  ready: `Make a recovery key to open your messages on a new ${deviceNoun}. Any old one stops working.`,
  locked: `Unlock your messages on this ${deviceNoun} first, then save a new recovery key.`,
  failed: "Whisprl couldn't check your messages. Try again.",
};

const SavedKey = ({ recoveryKey }) => {
  const dispatch = useDispatch();
  const username = useSelector((state) => state.user.user.username);
  const isConfirming = useIsLoading(ConfirmRecoveryKeySaved);
  const [isSaved, setIsSaved] = useState(false);

  const keep = async () => {
    if (await keepRecoveryKey(recoveryKey, username)) setIsSaved(true);
  };

  return (
    <Stack spacing={2.5}>
      <RecoveryKeyBox recoveryKey={recoveryKey} canCopy />
      <Button size="large" fullWidth variant="contained" startIcon={<KEEP_RECOVERY_KEY.Icon />} onClick={keep}>
        {KEEP_RECOVERY_KEY.label}
      </Button>
      <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary" }}>
        Lose it and your messages can&apos;t be recovered.
      </Typography>
      <Stack spacing={1}>
        <FormControlLabel
          sx={{ alignSelf: "center", mr: 0 }}
          control={<Checkbox checked={isSaved} onChange={(event) => setIsSaved(event.target.checked)} />}
          label={<Typography variant="body2">I&apos;ve saved my recovery key</Typography>}
        />
        <Button size="large" fullWidth variant="contained" disabled={!isSaved} loading={isConfirming} onClick={() => dispatch(ConfirmRecoveryKeySaved())}>
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
  const [hasKeyFailed, setHasKeyFailed] = useState(false);

  const makeKey = useCallback(
    async (thunk) => {
      const result = await dispatch(thunk());
      if (thunk.fulfilled.match(result)) setRecoveryKey(result.payload.recoveryKey);
      else setHasKeyFailed(true);
    },
    [dispatch]
  );

  // nothing during setup has saved a recovery key yet, so replacing one loses nothing
  useEffect(() => {
    dispatch(PrepareEncryption()).then(({ payload }) => {
      if (payload?.status === "setup") makeKey(CreateAccountKey);
      if (payload?.status === "ready") makeKey(ReplaceRecoveryKey);
    });
  }, [dispatch, makeKey]);

  const isMakingKey = status === "checking" || (["setup", "ready"].includes(status) && !hasKeyFailed);

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
      <Box component="img" src={protectMessages} alt="" sx={{ alignSelf: "center", width: "min(260px, 75%)", height: "auto" }} />
      <Typography sx={{ textAlign: "center", color: "text.secondary" }}>{recoveryKey ? KEY_LEAD : BEFORE_THE_KEY[status]}</Typography>
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
