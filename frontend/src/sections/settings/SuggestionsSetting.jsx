import { Switch } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { UpdateSuggestionSetting } from "@/redux/slices/actions/userActions";
import { SettingRow } from "@/sections/settings/SettingsSection";

const LABEL = "Suggest me to friends of my friends";

const SuggestionsSetting = () => {
  const dispatch = useDispatch();
  const isOn = useSelector((state) => state.user.user.suggestToFriendsOfFriends !== false);

  return (
    <SettingRow
      label={LABEL}
      description="They can find you in People you may know, and see the friends you share on your profile. People in your groups can still find you there."
    >
      <Switch checked={isOn} onChange={(event) => dispatch(UpdateSuggestionSetting(event.target.checked))} inputProps={{ "aria-label": LABEL }} />
    </SettingRow>
  );
};

export default SuggestionsSetting;
