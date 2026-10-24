import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, Typography } from "@mui/material";
import { KeyIcon, PasswordIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";

import FormProvider, { RHFTextField } from "@/components/hook-form";
import useIsLoading from "@/hooks/useIsLoading";
import { UnlockWithPasskey, UnlockWithRecoveryKey } from "@/redux/slices/actions/encryptionActions";
import { keepRecoveryKey } from "@/sections/encryption/RecoveryKeyBox";
import { pickFromPasswordManager } from "@/utils/crypto/keyVault";
import { notify } from "@/utils/notify";
import { canUsePasskeys } from "@/utils/passkeys";
import { deviceNoun, isApp } from "@/utils/platform";

const NOTHING_SAVED = "No recovery key is saved in this phone's password manager. Type it in instead.";

const UnlockForm = ({ onLater, onLostKey }) => {
  const dispatch = useDispatch();
  const username = useSelector((state) => state.user.user.username);
  const isUsingPasskey = useIsLoading(UnlockWithPasskey);
  const methods = useForm({ defaultValues: { recoveryKey: "" } });
  const {
    setError,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;
  const hasOtherWays = isApp || canUsePasskeys();

  const unlock = async (recoveryKey, isTyped) => {
    const result = await dispatch(UnlockWithRecoveryKey(recoveryKey));
    if (UnlockWithRecoveryKey.rejected.match(result)) {
      setError("recoveryKey", { message: result.payload });
      return;
    }
    // a typed key may be saved nowhere this phone can find, so the password manager is offered once it has worked
    if (isApp && isTyped) keepRecoveryKey(recoveryKey, username);
  };

  const unlockWithSavedKey = async () => {
    const { outcome, password } = await pickFromPasswordManager();
    if (outcome === "none") notify({ severity: "info", message: NOTHING_SAVED });
    if (outcome !== "picked") return;
    setValue("recoveryKey", password);
    await handleSubmit(({ recoveryKey }) => unlock(recoveryKey, false))();
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(({ recoveryKey }) => unlock(recoveryKey, true))}>
      <DialogTitle id="unlock-title" sx={{ pb: 0.5 }}>
        Unlock your messages
      </DialogTitle>
      <DialogContent>
        <Typography id="unlock-description" variant="body2" sx={{ color: "text.secondary", fontWeight: 400, mb: 3 }}>
          This {deviceNoun} has not opened your encrypted messages before. Use {canUsePasskeys() && "a passkey that unlocks them, or "}the recovery key you
          saved when Whisprl turned on encryption.
        </Typography>
        {hasOtherWays && (
          <>
            <Stack spacing={1.5}>
              {isApp && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  disabled={isSubmitting}
                  startIcon={<PasswordIcon weight="bold" />}
                  onClick={unlockWithSavedKey}
                >
                  Use my saved recovery key
                </Button>
              )}
              {canUsePasskeys() && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  loading={isUsingPasskey}
                  startIcon={<KeyIcon weight="bold" />}
                  onClick={() => dispatch(UnlockWithPasskey())}
                >
                  Unlock with a passkey
                </Button>
              )}
            </Stack>
            <Divider sx={{ my: 2.5, typography: "body2", color: "text.secondary" }}>or</Divider>
          </>
        )}
        <RHFTextField
          name="recoveryKey"
          label="Recovery key"
          placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
          autoComplete="off"
          autoFocus
          slotProps={{ htmlInput: { spellCheck: false, autoCapitalize: "characters" } }}
        />
        <Button color="inherit" size="small" onClick={onLostKey} sx={{ mt: 1.5, ml: -1 }}>
          I don&apos;t have my recovery key
        </Button>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {onLater && (
          <Button color="inherit" onClick={onLater}>
            Not now
          </Button>
        )}
        <Button type="submit" variant="contained" loading={isSubmitting}>
          Unlock
        </Button>
      </DialogActions>
    </FormProvider>
  );
};

const StartFresh = ({ onBack, onStartFresh }) => {
  const [starting, setStarting] = useState(false);

  const startFresh = async () => {
    setStarting(true);
    await onStartFresh();
    setStarting(false);
  };

  return (
    <>
      <DialogTitle id="unlock-title" sx={{ pb: 0.5 }}>
        Start fresh?
      </DialogTitle>
      <DialogContent>
        <Typography id="unlock-description" variant="body2" sx={{ color: "text.secondary", fontWeight: 400 }}>
          Whisprl will make you a new key and a new recovery key. Encrypted messages sent before now can no longer be opened on any {deviceNoun} of yours. Your
          friends keep their copies.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onBack}>
          Go back
        </Button>
        <Button variant="contained" color="error" loading={starting} onClick={startFresh}>
          Start fresh
        </Button>
      </DialogActions>
    </>
  );
};

const UnlockDialog = ({ onLater, onStartFresh }) => {
  const [lostKey, setLostKey] = useState(false);

  return (
    <Dialog
      open
      onClose={onLater}
      fullWidth
      maxWidth="xs"
      aria-labelledby="unlock-title"
      aria-describedby="unlock-description"
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      {lostKey ? (
        <StartFresh onBack={() => setLostKey(false)} onStartFresh={onStartFresh} />
      ) : (
        <UnlockForm onLater={onLater} onLostKey={() => setLostKey(true)} />
      )}
    </Dialog>
  );
};

export default UnlockDialog;
