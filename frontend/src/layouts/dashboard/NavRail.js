import { useState } from "react";
import { Badge, Box, ButtonBase, Divider, ListItemIcon, Menu, MenuItem, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AnimatePresence, m } from "framer-motion";
import { AddressBook, ChatCircleDots, CircleDashed, Gear, MoonStars, SignOut, SunDim, UserCircle } from "phosphor-react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import WhisprlMark from "@/assets/icons/logo/WhisprlMark.webp";
import useSettings from "@/hooks/useSettings";
import { LogoutUser } from "@/redux/slices/actions/authActions";
import { PATH_DASHBOARD } from "@/routes/paths";
import { chatPath } from "@/sections/chat/chatRoute";
import { isMuted } from "@/utils/chats";
import getAvatar from "@/utils/avatars";
import { NIGHT_INK } from "@/utils/colorPresets";

const { chat, status, contact, settings, profile } = PATH_DASHBOARD.general;
const DESTINATIONS = [
  { path: chat, label: "Chats", Icon: ChatCircleDots },
  { path: status, label: "Status", Icon: CircleDashed },
  { path: contact, label: "Contacts", Icon: AddressBook },
  { path: settings, label: "Settings", Icon: Gear },
];
// settings sits behind your photo on the rail, so the rail keeps only the places you move between
const RAIL_DESTINATIONS = DESTINATIONS.filter(({ path }) => path !== settings);
const RAIL_WIDTH = 76;
const TAB_BAR_HEIGHT = 65;
export const PAGE_HEIGHT_WITH_TAB_BAR = `calc(100dvh - ${TAB_BAR_HEIGHT}px - env(safe-area-inset-bottom))`;
const SLIDE = { type: "spring", stiffness: 500, damping: 38 };
const ON_RAIL = "#9DB0CB";

const useUnreadChats = () =>
  useSelector((state) => state.chat.conversations.filter((conversation) => !conversation.isArchived && conversation.unread > 0 && !isMuted(conversation)).length);

const isAt = (pathname, path) => Boolean(matchPath({ path, end: false }, pathname));
const spokenLabel = (label, badge) => (badge ? `${label}, ${badge} unread` : label);

const UnreadBadge = ({ count, children }) => (
  <Badge
    badgeContent={count}
    sx={{ "& .MuiBadge-badge": { bgcolor: "primary.glow", color: NIGHT_INK, fontWeight: 800, minWidth: 18, height: 18, fontSize: 11 } }}
  >
    {children}
  </Badge>
);

const RailItem = ({ label, isActive, badge, children, ...button }) => (
  <Tooltip title={label} placement="right">
    <ButtonBase
      {...button}
      aria-label={spokenLabel(label, badge)}
      aria-current={isActive ? "page" : undefined}
      sx={{
        position: "relative",
        width: 48,
        height: 48,
        borderRadius: 3.5,
        color: isActive ? "#fff" : ON_RAIL,
        transition: "color 160ms ease",
        "&:hover": { color: "#fff" },
        "&:focus-visible": { outline: 2, outlineColor: "primary.glow", outlineOffset: 2 },
      }}
    >
      {isActive && (
        <Box
          component={m.span}
          layoutId="rail-active"
          transition={SLIDE}
          sx={{ position: "absolute", inset: 0, borderRadius: 3.5, bgcolor: (theme) => alpha(theme.palette.primary.glow, 0.16) }}
        >
          <Box sx={{ position: "absolute", left: -14, top: 12, bottom: 12, width: 4, borderRadius: 4, bgcolor: "primary.glow" }} />
        </Box>
      )}
      <Box sx={{ position: "relative", display: "grid" }}>{children}</Box>
    </ButtonBase>
  </Tooltip>
);

const ThemeToggle = () => {
  const theme = useTheme();
  const { onToggleMode } = useSettings();
  const isDark = theme.palette.mode === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip title={label} placement="right">
      <ButtonBase
        onClick={onToggleMode}
        aria-label={label}
        sx={{ width: 44, height: 44, borderRadius: "50%", color: ON_RAIL, overflow: "hidden", "&:hover": { color: "#fff", bgcolor: alpha("#fff", 0.06) } }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={theme.palette.mode}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.22 }}
            style={{ display: "grid" }}
          >
            {isDark ? <SunDim size={24} /> : <MoonStars size={24} />}
          </m.span>
        </AnimatePresence>
      </ButtonBase>
    </Tooltip>
  );
};

const Mascot = () => (
  <Box
    sx={{
      position: "relative",
      width: 44,
      height: 44,
      display: "grid",
      placeItems: "center",
      borderRadius: "50%",
      background: (theme) => `radial-gradient(circle at 50% 60%, ${alpha(theme.palette.primary.glow, 0.55)}, ${alpha(theme.palette.primary.glow, 0)} 70%)`,
    }}
  >
    <Box component="img" src={WhisprlMark} alt="" sx={{ width: 36, height: "auto" }} />
  </Box>
);

const SideRail = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const activeId = useSelector((state) => state.chat.activeConversation?._id);
  // back to the chat left open, rather than closing it
  const chatsLink = chatPath(activeId);
  // following a link to the address already open would drop the state that lets Back close the chat
  const stayIfHere = (to) => (to === pathname ? (event) => event.preventDefault() : undefined);
  const unread = useUnreadChats();
  const { avatar, firstName, lastName } = useSelector((state) => state.user.user);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const closeProfileMenu = () => setProfileAnchor(null);

  return (
    <Stack
      component="nav"
      aria-label="Main"
      alignItems="center"
      sx={{ position: "sticky", top: 0, width: RAIL_WIDTH, height: "100dvh", flexShrink: 0, pt: 1.25, pb: 2.5, bgcolor: "chat.rail", zIndex: 2 }}
    >
      <Tooltip title="Whisprl" placement="right">
        <ButtonBase component={Link} to={chatsLink} onClick={stayIfHere(chatsLink)} aria-label="Whisprl, go to chats" sx={{ borderRadius: "50%" }}>
          <Mascot />
        </ButtonBase>
      </Tooltip>

      <Stack spacing={1.25} sx={{ mt: 5, flex: 1 }}>
        {RAIL_DESTINATIONS.map(({ path, label, Icon }) => {
          const isActive = isAt(pathname, path);
          const badge = path === chat ? unread : 0;
          const to = path === chat ? chatsLink : path;
          return (
            <RailItem
              key={path}
              component={Link}
              to={to}
              onClick={stayIfHere(to)}
              label={label}
              isActive={isActive}
              badge={badge}
            >
              <UnreadBadge count={badge}>
                <Icon size={24} weight={isActive ? "fill" : "regular"} />
              </UnreadBadge>
            </RailItem>
          );
        })}
      </Stack>

      <Stack spacing={1.5} alignItems="center">
        <ThemeToggle />
        <RailItem
          label="Profile and settings"
          isActive={isAt(pathname, profile) || isAt(pathname, settings)}
          onClick={(event) => setProfileAnchor(event.currentTarget)}
          aria-haspopup="menu"
          aria-expanded={Boolean(profileAnchor)}
        >
          {getAvatar(avatar, `${firstName} ${lastName}`, 36)}
        </RailItem>
        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={closeProfileMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
          slotProps={{ paper: { sx: { ml: 1.5, minWidth: 180 } } }}
        >
          <MenuItem component={Link} to={profile} onClick={closeProfileMenu}>
            <ListItemIcon>
              <UserCircle size={18} />
            </ListItemIcon>
            View profile
          </MenuItem>
          <MenuItem component={Link} to={settings} onClick={closeProfileMenu}>
            <ListItemIcon>
              <Gear size={18} />
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider sx={{ my: "4px !important" }} />
          <MenuItem
            onClick={() => {
              closeProfileMenu();
              dispatch(LogoutUser());
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>
              <SignOut size={18} />
            </ListItemIcon>
            Log out
          </MenuItem>
        </Menu>
      </Stack>
    </Stack>
  );
};

const TabLink = ({ to, label, isActive, badge, children }) => (
  <ButtonBase
    component={Link}
    to={to}
    aria-label={spokenLabel(label, badge)}
    aria-current={isActive ? "page" : undefined}
    sx={{ flex: 1, height: "100%", flexDirection: "column", gap: 0.25, color: isActive ? "primary.main" : "text.secondary" }}
  >
    <Box sx={{ position: "relative", width: 56, height: 30, display: "grid", placeItems: "center" }}>
      {isActive && (
        <Box
          component={m.span}
          layoutId="tab-active"
          transition={SLIDE}
          sx={{ position: "absolute", inset: 0, borderRadius: 99, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.14) }}
        />
      )}
      <Box sx={{ position: "relative", display: "grid" }}>{children}</Box>
    </Box>
    <Typography component="span" sx={{ fontSize: 11, fontWeight: isActive ? 800 : 600 }}>
      {label}
    </Typography>
  </ButtonBase>
);

const TabBar = () => {
  const { pathname } = useLocation();
  const unread = useUnreadChats();
  const { avatar, firstName, lastName } = useSelector((state) => state.user.user);

  return (
    <Stack
      component="nav"
      aria-label="Main"
      direction="row"
      sx={{
        position: "sticky",
        bottom: 0,
        zIndex: 2,
        height: `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom))`,
        pb: "env(safe-area-inset-bottom)",
        flexShrink: 0,
        bgcolor: "chat.list",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      {DESTINATIONS.map(({ path, label, Icon }) => {
        const isActive = isAt(pathname, path);
        const badge = path === chat ? unread : 0;
        return (
          <TabLink key={path} to={path} label={label} isActive={isActive} badge={badge}>
            <UnreadBadge count={badge}>
              <Icon size={22} weight={isActive ? "fill" : "regular"} />
            </UnreadBadge>
          </TabLink>
        );
      })}
      <TabLink to={profile} label="You" isActive={isAt(pathname, profile)}>
        {getAvatar(avatar, `${firstName} ${lastName}`, 24)}
      </TabLink>
    </Stack>
  );
};

const NavRail = () => {
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const { pathname } = useLocation();

  if (!isPhone) return <SideRail />;
  if (isAt(pathname, `${chat}/:chatId`)) return null;
  return <TabBar />;
};

export default NavRail;
