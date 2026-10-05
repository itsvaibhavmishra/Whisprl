import { useState } from "react";
import { Box, Button, Stack, Switch, Typography, useTheme } from "@mui/material";
import { ArrowUpRight, SignOut } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";

import { SOURCE_URL } from "@/config";
import DashboardPage from "@/layouts/dashboard/DashboardPage";
import { LogoutUser } from "@/redux/slices/actions/authActions";
import { PATH_DASHBOARD, PATH_DOCS } from "@/routes/paths";
import { AccentPicker, ThemeModePicker } from "@/components/AppearancePickers";
import ChangePasswordDialog from "@/sections/settings/ChangePasswordDialog";
import PasskeySetting from "@/sections/settings/PasskeySetting";
import RecoveryKeySetting from "@/sections/settings/RecoveryKeySetting";
import ChatPreview from "@/sections/settings/ChatPreview";
import { SettingLink, SettingRow, SettingsSection } from "@/sections/settings/SettingsSection";
import getAvatar from "@/utils/createAvatar";
import useSettings from "@/hooks/useSettings";
import { previewSound } from "@/utils/sounds";

const externalLink = { component: "a", target: "_blank", rel: "noopener", icon: ArrowUpRight };

const Appearance = () => (
  <Box
    component="section"
    aria-labelledby="appearance-title"
    sx={{
      display: "grid",
      gridTemplateColumns: { md: "minmax(0, 6fr) minmax(0, 5fr)" },
      columnGap: 8,
      rowGap: 5,
      alignItems: "center",
    }}
  >
    <Stack spacing={4} sx={{ order: { md: 2 } }}>
      <Box>
        <Typography id="appearance-title" component="h2" sx={{ m: 0, fontSize: 18, fontWeight: 700 }}>
          Appearance
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
          Changes apply straight away and are saved on this device.
        </Typography>
      </Box>
      <ThemeModePicker />
      <AccentPicker />
    </Stack>
    <ChatPreview />
  </Box>
);

const SoundSetting = () => {
  const { sounds, onToggleSounds } = useSettings();

  const toggle = (event) => {
    onToggleSounds();
    if (event.target.checked) previewSound();
  };

  return (
    <SettingRow label="Message sounds" description="A sound when you send a message, and when one arrives.">
      <Switch checked={sounds} onChange={toggle} inputProps={{ "aria-label": "Message sounds" }} />
    </SettingRow>
  );
};

const Settings = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { email, firstName, lastName, avatar } = useSelector((state) => state.user.user);
  const [changingPassword, setChangingPassword] = useState(false);

  return (
    <DashboardPage title="Settings" description="Make Whisprl look the way you like, and look after your account." maxWidth={1040}>
      <Appearance />

      <Box
        sx={{
          mt: { xs: 7, md: 10 },
          display: "grid",
          gridTemplateColumns: { md: "minmax(0, 7fr) minmax(0, 5fr)" },
          columnGap: 8,
          rowGap: 6,
          alignItems: "start",
        }}
      >
        <Stack spacing={6}>
          <SettingsSection title="Account">
            <SettingLink
              component={RouterLink}
              to={PATH_DASHBOARD.general.profile}
              leading={getAvatar(avatar, firstName, theme, 48)}
              label={`${firstName} ${lastName}`}
              description="Edit your photo, cover, name and status."
            />
            <SettingRow label="Email" description={email} />
          </SettingsSection>

          <SettingsSection title="Security">
            <SettingRow label="Password" description="The password you log in with.">
              <Button variant="outlined" color="inherit" onClick={() => setChangingPassword(true)}>
                Change password
              </Button>
            </SettingRow>
            <PasskeySetting />
            <RecoveryKeySetting />
          </SettingsSection>
        </Stack>

        <Stack spacing={6}>
          <SettingsSection title="Sounds">
            <SoundSetting />
          </SettingsSection>

          <SettingsSection title="About Whisprl">
            <SettingLink
              component={RouterLink}
              to={PATH_DOCS.general.tnc}
              label="Terms and conditions"
              description="What you agree to when you use Whisprl."
            />
            <SettingLink {...externalLink} href={SOURCE_URL} label="Source code" description="Whisprl is open source on GitHub." />
            <SettingLink
              {...externalLink}
              href={`${SOURCE_URL}/issues/new`}
              label="Report a problem"
              description="Opens a new issue on GitHub."
            />
          </SettingsSection>

          <Box>
            <Button color="error" variant="outlined" startIcon={<SignOut />} onClick={() => dispatch(LogoutUser())}>
              Log out
            </Button>
          </Box>
        </Stack>
      </Box>

      {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} />}
    </DashboardPage>
  );
};

export default Settings;
