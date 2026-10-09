import { useState } from "react";
import { Button } from "@mui/material";
import { useSelector } from "react-redux";

import UsernameDialog, { nextChangeOn } from "@/components/UsernameDialog";
import { SettingRow } from "@/sections/settings/SettingsSection";

const UsernameSetting = () => {
  const { username, usernameChangedAt } = useSelector((state) => state.user.user);
  const [isChanging, setIsChanging] = useState(false);
  const lockedUntil = nextChangeOn(usernameChangedAt);

  const description = lockedUntil
    ? `@${username}. You can change it again on ${lockedUntil.toLocaleDateString(undefined, { day: "numeric", month: "long" })}.`
    : `@${username}`;

  return (
    <SettingRow label="Username" description={username ? description : "Loading…"}>
      <Button variant="outlined" color="inherit" onClick={() => setIsChanging(true)} disabled={!username || Boolean(lockedUntil)}>
        Change
      </Button>
      {isChanging && <UsernameDialog current={username} onClose={() => setIsChanging(false)} />}
    </SettingRow>
  );
};

export default UsernameSetting;
