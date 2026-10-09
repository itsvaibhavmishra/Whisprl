import { useEffect, useState } from "react";
import { Button, Stack, Switch, Typography } from "@mui/material";
import { ArrowUpRight } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";

import { AccentPicker, ThemeModePicker } from "@/components/AppearancePickers";
import Pane, { READING_WIDTH } from "@/components/Pane";
import { SOURCE_URL } from "@/config";
import useSettings from "@/hooks/useSettings";
import { GetMyProfile } from "@/redux/slices/actions/userActions";
import { PATH_DASHBOARD, PATH_DOCS } from "@/routes/paths";
import ProfileEditor from "@/sections/profile/ProfileEditor";
import BirthdaySetting from "@/sections/settings/BirthdaySetting";
import BlockedPeopleSetting from "@/sections/settings/BlockedPeopleSetting";
import ChangePasswordDialog from "@/sections/settings/ChangePasswordDialog";
import ChatPreview from "@/sections/settings/ChatPreview";
import PasskeySetting from "@/sections/settings/PasskeySetting";
import QuickReactionsSetting from "@/sections/settings/QuickReactionsSetting";
import RecoveryKeySetting from "@/sections/settings/RecoveryKeySetting";
import { SettingLink, SettingRow, SettingsSection } from "@/sections/settings/SettingsSection";
import StatusPrivacySetting from "@/sections/settings/StatusPrivacySetting";
import SuggestionsSetting from "@/sections/settings/SuggestionsSetting";
import UsernameSetting from "@/sections/settings/UsernameSetting";
import WallpaperSetting from "@/sections/settings/WallpaperSetting";
import ReleaseBanner from "@/sections/whats-new/ReleaseBanner";
import ReleaseHighlights from "@/sections/whats-new/ReleaseHighlights";
import { RELEASES, releaseNote, releaseTitle } from "@/sections/whats-new/whatsNew";
import getAvatar from "@/utils/avatars";
import { askForNotifications, notificationPermission } from "@/utils/notifications";
import { previewSound } from "@/utils/sounds";

const externalLink = { component: "a", target: "_blank", rel: "noopener", icon: ArrowUpRight };

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

const ClockSetting = () => {
  const { use24Hour, onToggle24Hour } = useSettings();
  return (
    <SettingRow label="24-hour time" description="Show times like 15:05 instead of 3:05 PM.">
      <Switch checked={Boolean(use24Hour)} onChange={onToggle24Hour} inputProps={{ "aria-label": "24-hour time" }} />
    </SettingRow>
  );
};

const NotificationSetting = () => {
  const { notifications, onSetNotifications } = useSettings();
  const [permission, setPermission] = useState(notificationPermission);
  if (permission === "unsupported") return null;

  const toggle = async () => {
    if (notifications) return onSetNotifications(false);
    const answer = await askForNotifications();
    setPermission(answer);
    if (answer === "granted") onSetNotifications(true);
  };

  const description =
    permission === "denied"
      ? "Your browser is blocking notifications from Whisprl. Allow them in this site's settings, then switch this on."
      : "A notification for each new message while Whisprl is in the background. Muted chats stay quiet.";

  return (
    <SettingRow label="Notifications" description={description}>
      <Switch checked={notifications && permission === "granted"} onChange={toggle} inputProps={{ "aria-label": "Notifications" }} />
    </SettingRow>
  );
};

const ProfileSettings = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(GetMyProfile());
  }, [dispatch]);

  return <ProfileEditor />;
};

const AppearanceSettings = () => (
  <Stack spacing={6}>
    <Stack spacing={4}>
      <ThemeModePicker />
      <AccentPicker />
    </Stack>
    <ChatPreview />
    <WallpaperSetting />
  </Stack>
);

const AccountSettings = () => {
  const { email, firstName, lastName, avatar } = useSelector((state) => state.user.user);
  return (
    <SettingsSection>
      <SettingLink
        component={RouterLink}
        to={PATH_DASHBOARD.general.profile}
        leading={getAvatar(avatar, firstName, 48)}
        label={`${firstName} ${lastName}`}
        description="Edit your photo, cover, name, birthday and bio."
      />
      <UsernameSetting />
      <SettingRow label="Email" description={email} />
    </SettingsSection>
  );
};

const SecuritySettings = () => {
  const [changingPassword, setChangingPassword] = useState(false);
  return (
    <SettingsSection>
      <SettingRow label="Password" description="The password you log in with.">
        <Button variant="outlined" color="inherit" onClick={() => setChangingPassword(true)}>
          Change password
        </Button>
      </SettingRow>
      <PasskeySetting />
      <RecoveryKeySetting />
      {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} />}
    </SettingsSection>
  );
};

const ChatSettings = () => (
  <SettingsSection>
    <QuickReactionsSetting />
    <SoundSetting />
    <NotificationSetting />
    <ClockSetting />
    <BlockedPeopleSetting />
  </SettingsSection>
);

const PrivacySettings = () => (
  <Stack spacing={6}>
    <SettingsSection title="Status">
      <StatusPrivacySetting />
    </SettingsSection>
    <SettingsSection title="Contacts">
      <SuggestionsSetting />
      <BirthdaySetting />
    </SettingsSection>
  </Stack>
);

const BANNER_PATTERNS = ["whispers", "cats", "sky"];

const WhatsNewSettings = () =>
  RELEASES.length ? (
    <Stack spacing={5}>
      {RELEASES.map((release, index) => (
        <Stack key={release.version} component="section" aria-label={releaseTitle(release)} spacing={2}>
          <ReleaseBanner title={releaseTitle(release)} subtitle={releaseNote(release)} pattern={BANNER_PATTERNS[index % BANNER_PATTERNS.length]} />
          <ReleaseHighlights highlights={release.highlights} isWide />
        </Stack>
      ))}
    </Stack>
  ) : (
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      The highlights of each release show here once it is out.
    </Typography>
  );

const AboutSettings = () => (
  <SettingsSection>
    <SettingLink component={RouterLink} to={PATH_DOCS.general.tnc} label="Terms and conditions" description="What you agree to when you use Whisprl." />
    <SettingLink {...externalLink} href={SOURCE_URL} label="Source code" description="Whisprl is open source on GitHub." />
    <SettingLink {...externalLink} href={`${SOURCE_URL}/issues/new`} label="Report a problem" description="Opens a new issue on GitHub." />
  </SettingsSection>
);

const CONTENT = {
  profile: ProfileSettings,
  appearance: AppearanceSettings,
  account: AccountSettings,
  security: SecuritySettings,
  chats: ChatSettings,
  privacy: PrivacySettings,
  "whats-new": WhatsNewSettings,
  about: AboutSettings,
};

const SettingsPane = ({ category, onBack }) => {
  const Content = CONTENT[category.slug];
  return (
    <Pane title={category.label} subtitle={category.note ?? category.description} onBack={onBack} width={READING_WIDTH}>
      <Content />
    </Pane>
  );
};

export default SettingsPane;
