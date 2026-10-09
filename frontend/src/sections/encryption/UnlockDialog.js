import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Typography } from "@mui/material";
import { Key } from "phosphor-react";
import { LoadingButton } from "@mui/lab";
import { useDispatch } from "react-redux";

import FormProvider, { RHFTextField } from "@/components/hook-form";
import useIsLoading from "@/hooks/useIsLoading";
import { UnlockWithPasskey, UnlockWithRecoveryKey } from "@/redux/slices/actions/encryptionActions";
import { canUsePasskeys } from "@/utils/passkeys";

const UnlockForm = ({ onLater, onLostKey }) => {
  const dispatch = useDispatch();
  const isUsingPasskey = useIsLoading(UnlockWithPasskey);
  const methods = useForm({ defaultValues: { recoveryKey: "" } });
  const {
    setError,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async ({ recoveryKey }) => {
    const result = await dispatch(UnlockWithRecoveryKey(recoveryKey));
    if (UnlockWithRecoveryKey.rejected.match(result)) {
      setError("recoveryKey", { message: result.payload });
    }
  };

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <DialogTitle id="unlock-title" sx={{ pb: 0.5 }}>
        Unlock your messages
      </DialogTitle>
      <DialogContent>
        <Typography id="unlock-description" variant="body2" sx={{ color: "text.secondary", fontWeight: 400, mb: 3 }}>
          This browser has not opened your encrypted messages before. Use a passkey that unlocks them, or the recovery
          key you saved when Whisprl turned on encryption.
        </Typography>
        {canUsePasskeys() && (
          <>
            <LoadingButton
              fullWidth
              variant="outlined"
              color="inherit"
              loading={isUsingPasskey}
              startIcon={<Key weight="bold" />}
              onClick={() => dispatch(UnlockWithPasskey())}
            >
              Unlock with a passkey
            </LoadingButton>
            <Divider sx={{ my: 2.5, typography: "body2", color: "text.secondary" }}>or</Divider>
          </>
        )}
        <RHFTextField
          name="recoveryKey"
          label="Recovery key"
          placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
          autoComplete="off"
          autoFocus
          inputProps={{ spellCheck: false, autoCapitalize: "characters" }}
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
        <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
          Unlock
        </LoadingButton>
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
          Whisprl will make you a new key and a new recovery key. Encrypted messages sent before now can no longer be
          opened on any of your browsers. Your friends keep their copies.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onBack}>
          Go back
        </Button>
        <LoadingButton variant="contained" color="error" loading={starting} onClick={startFresh}>
          Start fresh
        </LoadingButton>
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
      PaperProps={{ sx: { borderRadius: 3 } }}
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
