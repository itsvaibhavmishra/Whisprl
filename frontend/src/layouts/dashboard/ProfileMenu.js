import { Divider, ListItemIcon, Menu, MenuItem } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Gear, MoonStars, SignOut, SunDim, UserCircle } from "phosphor-react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";

import useSettings from "@/hooks/useSettings";
import { LogoutUser } from "@/redux/slices/actions/authActions";
import { PATH_DASHBOARD } from "@/routes/paths";

const { settings, profile } = PATH_DASHBOARD.general;

// the rail has a light and dark switch of its own, so only the phone's bar needs one in here
const ProfileMenu = ({ anchorEl, hasThemeSwitch = false, onClose, ...placement }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { onToggleMode } = useSettings();
  const isDark = theme.palette.mode === "dark";

  const choose = (action) => () => {
    onClose();
    action();
  };

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose} {...placement}>
      <MenuItem component={Link} to={profile} onClick={onClose}>
        <ListItemIcon>
          <UserCircle size={18} />
        </ListItemIcon>
        View profile
      </MenuItem>
      <MenuItem component={Link} to={settings} onClick={onClose}>
        <ListItemIcon>
          <Gear size={18} />
        </ListItemIcon>
        Settings
      </MenuItem>
      {hasThemeSwitch && (
        <MenuItem onClick={choose(onToggleMode)}>
          <ListItemIcon>{isDark ? <SunDim size={18} /> : <MoonStars size={18} />}</ListItemIcon>
          {isDark ? "Light mode" : "Dark mode"}
        </MenuItem>
      )}
      <Divider sx={{ my: "4px !important" }} />
      <MenuItem onClick={choose(() => dispatch(LogoutUser()))} sx={{ color: "error.main" }}>
        <ListItemIcon sx={{ color: "inherit" }}>
          <SignOut size={18} />
        </ListItemIcon>
        Log out
      </MenuItem>
    </Menu>
  );
};

export default ProfileMenu;
