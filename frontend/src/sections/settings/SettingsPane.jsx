import { useEffect, useState } from "react";
import { Button, Stack, Switch, Typography } from "@mui/material";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";

import { AccentPicker, ThemeModePicker } from "@/components/AppearancePickers";
import Pane, { READING_WIDTH } from "@/components/Pane";
import { SOURCE_URL } from "@/config";
import useSettings from "@/hooks/useSettings";
import { ForgetPushDevice } from "@/redux/slices/actions/pushActions";
import { GetMyProfile } from "@/redux/slices/actions/userActions";
import { PATH_DASHBOARD, PATH_DOCS } from "@/routes/paths";
import ProfileEditor from "@/sections/profile/ProfileEditor";
import BirthdaySetting from "@/sections/settings/BirthdaySetting";
import BlockedPeopleSetting from "@/sections/settings/BlockedPeopleSetting";
import ChangePasswordDialog from "@/sections/settings/ChangePasswordDialog";
import ChatPreview from "@/sections/settings/ChatPreview";
import DeleteAccountDialog from "@/sections/settings/DeleteAccountDialog";
import AppLockSetting from "@/sections/settings/AppLockSetting";
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
import { isApp } from "@/utils/platform";
import { isStaff } from "@/utils/roles";
import { feel } from "@/utils/haptics";
import { previewSound } from "@/utils/sounds";

const externalLink = { component: "a", target: "_blank", rel: "noopener", icon: ArrowUpRightIcon };

const VibrationSetting = () => {
  const { haptics, onToggleHaptics } = useSettings();

  const toggle = (event) => {
    onToggleHaptics();
    // a frame later, once the switch is saved, since a buzz checks the saved setting
    if (event.target.checked) requestAnimationFrame(() => feel());
  };

  return (
    <SettingRow label="Vibration" description="A light buzz when you send, react, hold a message or play a game.">
      <Switch checked={haptics} onChange={toggle} slotProps={{ input: { "aria-label": "Vibration" } }} />
    </SettingRow>
  );
};

const SoundSetting = () => {
  const { sounds, onToggleSounds } = useSettings();

  const toggle = (event) => {
    onToggleSounds();
    if (event.target.checked) previewSound();
  };

  return (
    <SettingRow label="Message sounds" description="A sound when you send a message, and when one arrives.">
      <Switch checked={sounds} onChange={toggle} slotProps={{ input: { "aria-label": "Message sounds" } }} />
    </SettingRow>
  );
};

const ClockSetting = () => {
  const { use24Hour, onToggle24Hour } = useSettings();
  return (
    <SettingRow label="24-hour time" description="Show times like 15:05 instead of 3:05 PM.">
      <Switch checked={Boolean(use24Hour)} onChange={onToggle24Hour} slotProps={{ input: { "aria-label": "24-hour time" } }} />
    </SettingRow>
  );
};

const NOTIFICATIONS_BLOCKED = isApp
  ? "Notifications are off for Whisprl in your phone's settings. Turn them on there, then switch this on."
  : "Your browser is blocking notifications from Whisprl. Allow them in this site's settings, then switch this on.";

const NotificationSetting = () => {
  const dispatch = useDispatch();
  const { notifications, onSetNotifications } = useSettings();
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    notificationPermission().then(setPermission);
  }, []);

  if (permission === "unsupported") return null;

  const toggle = async () => {
    if (notifications) {
      if (isApp) dispatch(ForgetPushDevice());
      return onSetNotifications(false);
    }
    const answer = await askForNotifications();
    setPermission(answer);
    if (answer === "granted") onSetNotifications(true);
  };

  const description =
    permission === "denied" ? NOTIFICATIONS_BLOCKED : "A notification for each new message while Whisprl is in the background. Muted chats stay quiet.";

  return (
    <SettingRow label="Notifications" description={description}>
      <Switch checked={notifications && permission === "granted"} onChange={toggle} slotProps={{ input: { "aria-label": "Notifications" } }} />
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

// staff hand back their access before they can go, so the server would refuse them anyway
const DeleteAccountSetting = () => {
  const role = useSelector((state) => state.user.user.role);
  const [isDeleting, setIsDeleting] = useState(false);
  if (isStaff(role)) return null;

  return (
    <SettingRow
      label="Delete account"
      description="Your account is hidden as soon as you confirm and deleted 14 days later. Logging in before then brings it back."
    >
      <Button variant="outlined" color="error" onClick={() => setIsDeleting(true)}>
        Delete account
      </Button>
      {isDeleting && <DeleteAccountDialog onClose={() => setIsDeleting(false)} />}
    </SettingRow>
  );
};

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
      <DeleteAccountSetting />
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
      {isApp && <AppLockSetting />}
      <RecoveryKeySetting />
      {changingPassword && <ChangePasswordDialog onClose={() => setChangingPassword(false)} />}
    </SettingsSection>
  );
};

const ChatSettings = () => (
  <SettingsSection>
    <QuickReactionsSetting />
    <SoundSetting />
    {isApp && <VibrationSetting />}
    <NotificationSetting />
    <ClockSetting />
    <BlockedPeopleSetting />
  </SettingsSection>
);

const PrivacyPolicyLink = () => (
  <SettingLink component={RouterLink} to={PATH_DOCS.general.privacy} label="Privacy policy" description="What Whisprl stores, and who else handles it." />
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
    <SettingsSection>
      <PrivacyPolicyLink />
    </SettingsSection>
  </Stack>
);

const BANNER_PATTERNS = ["whispers", "cats", "sky"];
const RELEASES_PER_PAGE = 3;

const ReleaseList = () => {
  const [shown, setShown] = useState(RELEASES_PER_PAGE);
  return (
    <Stack spacing={5}>
      {RELEASES.slice(0, shown).map((release, index) => (
        <Stack key={release.version} component="section" aria-label={releaseTitle(release)} spacing={2}>
          <ReleaseBanner title={releaseTitle(release)} subtitle={releaseNote(release)} pattern={BANNER_PATTERNS[index % BANNER_PATTERNS.length]} />
          <ReleaseHighlights highlights={release.highlights} isWide />
        </Stack>
      ))}
      {shown < RELEASES.length && (
        <Button variant="outlined" color="inherit" onClick={() => setShown(shown + RELEASES_PER_PAGE)} sx={{ alignSelf: "center" }}>
          Show older releases
        </Button>
      )}
    </Stack>
  );
};

const WhatsNewSettings = () =>
  RELEASES.length ? (
    <ReleaseList />
  ) : (
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      The highlights of each release show here once it is out.
    </Typography>
  );

const AboutSettings = () => (
  <SettingsSection>
    <SettingLink component={RouterLink} to={PATH_DOCS.general.tnc} label="Terms and conditions" description="What you agree to when you use Whisprl." />
    <PrivacyPolicyLink />
    <SettingLink
      component={RouterLink}
      to={PATH_DOCS.general.childSafety}
      label="Child safety"
      description="How Whisprl keeps young people safe, and how to report harm."
    />
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
