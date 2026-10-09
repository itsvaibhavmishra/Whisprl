import { useEffect, useId, useState } from "react";
import { Alert, Box, Chip, Stack, Tab, Tabs, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Key } from "phosphor-react";
import { useDispatch } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { PrepareEncryption } from "@/redux/slices/actions/encryptionActions";
import { GetOnboarding, SkipSetupStep } from "@/redux/slices/actions/onboardingActions";
import { AddPasskey, LinkPasskey } from "@/redux/slices/actions/passkeyActions";
import { canUsePasskeys } from "@/utils/passkeys";

const DEVICE_GUIDES = [
  {
    device: "Computer",
    text: "Your browser offers to save the passkey here, often in iCloud Keychain, Windows Hello or Google Password Manager. Pick one that syncs, and the passkey follows you to your other devices.",
  },
  {
    device: "iPhone",
    text: "On the iPhone itself, confirm with Face ID or your passcode and it saves to iCloud Keychain. From a computer, choose to use a phone and scan the code with the Camera app, with Bluetooth on.",
  },
  {
    device: "Android",
    text: "On the phone itself, confirm with your screen lock and it saves to Google Password Manager. From a computer, choose to use a phone and scan the code with the Camera app, with Bluetooth on. Google Lens and authenticator apps can't add passkeys.",
  },
];

const guideForThisDevice = () => {
  if (/iPhone|iPad/.test(navigator.userAgent)) return 1;
  return /Android/.test(navigator.userAgent) ? 2 : 0;
};

const DeviceGuide = () => {
  const id = useId();
  const [open, setOpen] = useState(guideForThisDevice);

  return (
    <Box component="section" aria-label="How it works on your device" sx={{ border: 1, borderColor: "divider", borderRadius: 3, overflow: "hidden" }}>
      <Tabs value={open} onChange={(_, index) => setOpen(index)} variant="fullWidth" sx={{ minHeight: 44 }}>
        {DEVICE_GUIDES.map(({ device }, index) => (
          <Tab key={device} label={device} id={`${id}-tab-${index}`} aria-controls={`${id}-panel`} sx={{ minHeight: 44, textTransform: "none" }} />
        ))}
      </Tabs>
      <Typography
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${open}`}
        variant="body2"
        sx={{ px: 2, py: 1.75, borderTop: 1, borderColor: "divider", color: "text.secondary" }}
      >
        {DEVICE_GUIDES[open].text}
      </Typography>
    </Box>
  );
};

const PasskeyStep = () => {
  const dispatch = useDispatch();
  const isAdding = useIsLoading(AddPasskey);
  const isLinking = useIsLoading(LinkPasskey);
  const isSkipping = useIsLoading(SkipSetupStep);

  // the passkey can only take a copy of the message key from a browser that has opened the messages
  useEffect(() => {
    dispatch(PrepareEncryption());
  }, [dispatch]);

  const add = async () => {
    const result = await dispatch(AddPasskey());
    if (AddPasskey.fulfilled.match(result)) dispatch(GetOnboarding());
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography component="h2" sx={{ m: 0, fontSize: 20, fontWeight: 700 }}>
            Add a passkey
          </Typography>
          <Chip label="Recommended" size="small" color="primary" variant="outlined" />
        </Stack>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Log in with your face, fingerprint or screen lock instead of a password. A passkey also unlocks your messages on a new browser, so the
          recovery key stays a backup.
        </Typography>
      </Stack>
      {canUsePasskeys() ? (
        <LoadingButton size="large" variant="contained" fullWidth startIcon={<Key weight="bold" />} loading={isAdding || isLinking} onClick={add}>
          Add a passkey
        </LoadingButton>
      ) : (
        <Alert severity="info">This browser can&apos;t make passkeys. You can add one later from Settings on another browser.</Alert>
      )}
      <DeviceGuide />
      <LoadingButton fullWidth color="inherit" loading={isSkipping} onClick={() => dispatch(SkipSetupStep("passkey"))}>
        Skip for now
      </LoadingButton>
    </Stack>
  );
};

export default PasskeyStep;
