import { useEffect, useState } from "react";
import { Switch } from "@mui/material";

import useSettings from "@/hooks/useSettings";
import { SettingRow } from "@/sections/settings/SettingsSection";
import { canConfirmOwner, confirmOwner } from "@/utils/crypto/keyVault";

const AppLockSetting = () => {
  const { appLock, onSetAppLock } = useSettings();
  const [hasScreenLock, setHasScreenLock] = useState(null);

  useEffect(() => {
    canConfirmOwner().then(setHasScreenLock, () => setHasScreenLock(false));
  }, []);

  // switching it on asks once first, so nobody turns on a lock their phone cannot open
  const toggle = async (event) => {
    if (!event.target.checked) {
      onSetAppLock(false);
      return;
    }
    if (await confirmOwner("Turn on app lock")) onSetAppLock(true);
  };

  const description =
    hasScreenLock === false
      ? "Set a screen lock on this phone first, then switch this on."
      : "Ask for your fingerprint, face or screen lock when you open Whisprl, or come back to it after a minute away.";

  return (
    <SettingRow label="App lock" description={description}>
      <Switch checked={appLock && hasScreenLock !== false} disabled={!hasScreenLock} onChange={toggle} inputProps={{ "aria-label": "App lock" }} />
    </SettingRow>
  );
};

export default AppLockSetting;
