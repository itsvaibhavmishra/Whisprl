import { Box, ButtonBase, Stack, Switch, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { CaretRight, MoonStars, SignOut } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import Wordmark from "@/components/Wordmark";
import useSettings from "@/hooks/useSettings";
import { LogoutUser } from "@/redux/slices/actions/authActions";
import { CATEGORIES, PROFILE, settingsPathOf } from "@/sections/settings/settingsRoute";
import getAvatar from "@/utils/avatars";

const GROUPS = [...new Set(CATEGORIES.map((category) => category.group))].map((group) => CATEGORIES.filter((category) => category.group === group));

const rowLook = (isSelected, color = "primary") => ({
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  px: 1.25,
  borderRadius: 2.5,
  justifyContent: "flex-start",
  textAlign: "left",
  bgcolor: isSelected ? (theme) => alpha(theme.palette[color].main, 0.12) : "transparent",
  "&:hover": { bgcolor: (theme) => alpha(theme.palette[color].main, isSelected ? 0.16 : 0.08) },
  "&.Mui-focusVisible": { outline: 2, outlineColor: `${color}.main`, outlineOffset: -2 },
});

const Tile = ({ icon: Icon, tint, color = "common.white" }) => (
  <Box sx={{ width: 34, height: 34, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", color, bgcolor: tint }}>
    <Icon size={19} weight="fill" />
  </Box>
);

const ProfileCard = ({ isSelected, isWide }) => {
  const { firstName, lastName, username, avatar } = useSelector((state) => state.user.user);
  return (
    <ButtonBase component={Link} to={settingsPathOf(PROFILE)} aria-current={isSelected ? "page" : undefined} sx={{ ...rowLook(isSelected), py: 1.25 }}>
      {getAvatar(avatar, firstName, 52)}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>{`${firstName} ${lastName}`}</Typography>
        <Typography noWrap component="p" sx={{ m: 0, mt: 0.25, fontSize: 13, fontWeight: 500, color: "text.secondary" }}>
          {username ? `@${username}` : "Edit your profile"}
        </Typography>
      </Box>
      {!isWide && <CaretRight size={16} weight="bold" />}
    </ButtonBase>
  );
};

const CategoryRow = ({ category: { label, icon: Icon, tint }, to, isSelected, isWide }) => (
  <ButtonBase component={Link} to={to} aria-current={isSelected ? "page" : undefined} sx={{ ...rowLook(isSelected), py: 1 }}>
    <Tile icon={Icon} tint={tint} />
    <Typography sx={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: isSelected ? 700 : 600 }}>{label}</Typography>
    {!isWide && <CaretRight size={16} weight="bold" />}
  </ButtonBase>
);

// the rail has a light and dark switch of its own, so only a phone's list needs one
const ThemeRow = () => {
  const theme = useTheme();
  const { onToggleMode } = useSettings();
  return (
    <Box component="label" sx={{ ...rowLook(false), py: 1, cursor: "pointer" }}>
      <Tile icon={MoonStars} tint="grey.700" />
      <Typography sx={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600 }}>Dark mode</Typography>
      <Switch checked={theme.palette.mode === "dark"} onChange={onToggleMode} sx={{ mr: -1 }} />
    </Box>
  );
};

const LogOutRow = () => {
  const dispatch = useDispatch();
  return (
    <ButtonBase onClick={() => dispatch(LogoutUser())} sx={{ ...rowLook(false, "error"), py: 1, color: "error.main" }}>
      <Tile icon={SignOut} tint={(theme) => alpha(theme.palette.error.main, 0.14)} color="error.main" />
      <Typography sx={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: "inherit" }}>Log out</Typography>
    </ButtonBase>
  );
};

const SettingsList = ({ current, isWide }) => (
  <Stack component="nav" aria-label="Settings" sx={{ height: "100%", bgcolor: "chat.list" }}>
    <Box sx={{ px: 2, py: 1.25 }}>
      <Typography component="h1" sx={{ m: 0, minHeight: 44, display: "flex", alignItems: "center" }}>
        <Wordmark name="Settings" fontSize={30} />
      </Typography>
    </Box>
    <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 2 }}>
      <ProfileCard isSelected={current === PROFILE.slug} isWide={isWide} />
      {GROUPS.map((group) => (
        <Stack key={group[0].slug} component="ul" spacing={0.25} sx={{ m: 0, mt: 2, pt: 2, px: 0, listStyle: "none", borderTop: 1, borderColor: "divider" }}>
          {group.map((category) => (
            <li key={category.slug}>
              <CategoryRow category={category} to={settingsPathOf(category)} isSelected={category.slug === current} isWide={isWide} />
            </li>
          ))}
          {!isWide && group === GROUPS[0] && (
            <li>
              <ThemeRow />
            </li>
          )}
        </Stack>
      ))}
    </Box>
    <Box sx={{ px: 1, py: 1.25, borderTop: 1, borderColor: "divider" }}>
      <LogOutRow />
    </Box>
  </Stack>
);

export default SettingsList;
