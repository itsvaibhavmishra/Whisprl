import { useEffect, useState } from "react";
import { Alert, Chip, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { BellRinging } from "phosphor-react";
import { useDispatch } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import useSettings from "@/hooks/useSettings";
import { AllowNotifications, GetOnboarding, SkipSetupStep } from "@/redux/slices/actions/onboardingActions";
import { askForNotifications, notificationPermission } from "@/utils/notifications";

const REFUSALS = {
  denied: "Your browser is blocking notifications from Whisprl. Allow them in this site's settings, then turn them on from Settings.",
  unsupported: "This browser can't show notifications. On an iPhone, add Whisprl to your Home Screen and open it from there, then turn them on from Settings.",
};

const NotificationsStep = () => {
  const dispatch = useDispatch();
  const { onSetNotifications } = useSettings();
  const isSaving = useIsLoading(AllowNotifications);
  const isSkipping = useIsLoading(SkipSetupStep);
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    notificationPermission().then(setPermission);
  }, []);

  const turnOn = async () => {
    const answer = await askForNotifications();
    setPermission(answer);
    if (answer !== "granted") return;
    onSetNotifications(true);
    const result = await dispatch(AllowNotifications());
    if (AllowNotifications.fulfilled.match(result)) dispatch(GetOnboarding());
  };

  const refusal = REFUSALS[permission];

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography component="h2" sx={{ m: 0, fontSize: 20, fontWeight: 700 }}>
            Turn on notifications
          </Typography>
          <Chip label="Recommended" size="small" color="primary" variant="outlined" />
        </Stack>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Hear about a message while Whisprl is in another tab or behind another app. Muted chats stay quiet, and you can switch this off in Settings.
        </Typography>
      </Stack>
      {refusal ? (
        <Alert severity="info">{refusal}</Alert>
      ) : (
        <LoadingButton size="large" variant="contained" fullWidth startIcon={<BellRinging weight="bold" />} loading={isSaving} onClick={turnOn}>
          Turn on notifications
        </LoadingButton>
      )}
      <LoadingButton fullWidth color="inherit" loading={isSkipping} onClick={() => dispatch(SkipSetupStep("notifications"))}>
        Skip for now
      </LoadingButton>
    </Stack>
  );
};

export default NotificationsStep;
