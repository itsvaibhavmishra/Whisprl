import { Switch } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { UpdateBirthdaySetting } from "@/redux/slices/actions/userActions";
import { SettingRow } from "@/sections/settings/SettingsSection";

const LABEL = "Show my birthday to friends";

const BirthdaySetting = () => {
  const dispatch = useDispatch();
  const isOn = useSelector((state) => state.user.user.showBirthdayToFriends !== false);

  return (
    <SettingRow label={LABEL} description="Friends see the day and month on your profile and in Birthdays this week. Nobody sees the year.">
      <Switch checked={isOn} onChange={(event) => dispatch(UpdateBirthdaySetting(event.target.checked))} inputProps={{ "aria-label": LABEL }} />
    </SettingRow>
  );
};

export default BirthdaySetting;
