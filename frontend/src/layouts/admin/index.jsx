import { useEffect, useRef } from "react";
import { Box, ButtonBase, IconButton, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArrowLeftIcon,
  ChartLineUpIcon,
  ClockCounterClockwiseIcon,
  CrownIcon,
  FlagIcon,
  GameControllerIcon,
  IdentificationBadgeIcon,
  ShieldStarIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { useSelector } from "react-redux";
import { Link, Navigate, Outlet, matchPath, useLocation } from "react-router-dom";

import WhisprlMark from "@/assets/icons/logo/WhisprlMark.webp";
import { PageArea } from "@/components/LoadingScreen";
import Wordmark from "@/components/Wordmark";
import { ON_RAIL } from "@/layouts/dashboard/NavRail";
import { PATH_ADMIN, PATH_DASHBOARD } from "@/routes/paths";
import Notice from "@/sections/admin/Notice";
import getAvatar from "@/utils/avatars";
import { can } from "@/utils/roles";

const SIDEBAR_WIDTH = 248;
// the top bar already sits below the status bar, so the page area starts clear of it
const PAGE_AREA = { isUnderStatusBar: false };
const DESTINATIONS = [
  { path: PATH_ADMIN.overview, label: "Overview", Icon: ChartLineUpIcon, permission: "overview" },
  { path: PATH_ADMIN.people, label: "People", Icon: UsersIcon, permission: "people" },
  { path: PATH_ADMIN.reports, label: "Reports", Icon: FlagIcon, permission: "reports" },
  { path: PATH_ADMIN.requests, label: "Game requests", Icon: GameControllerIcon, permission: "requests" },
  { path: PATH_ADMIN.audit, label: "Audit log", Icon: ClockCounterClockwiseIcon, permission: "audit" },
  { path: PATH_ADMIN.team, label: "Team", Icon: IdentificationBadgeIcon, permission: "team" },
];
const ROLE_BADGES = { owner: { label: "Owner", Icon: CrownIcon }, admin: { label: "Admin", Icon: ShieldStarIcon } };

const RoleBadge = ({ role }) => {
  const { label, Icon } = ROLE_BADGES[role];
  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ alignItems: "center", px: 1, py: 0.375, borderRadius: 99, color: "primary.glow", bgcolor: (theme) => alpha(theme.palette.primary.glow, 0.14) }}
    >
      <Icon size={13} weight="fill" aria-hidden />
      <Typography component="span" sx={{ fontSize: 12, fontWeight: 800 }}>
        {label}
      </Typography>
    </Stack>
  );
};

const SidebarLink = ({ path, label, Icon, isActive }) => (
  <ButtonBase
    component={Link}
    to={path}
    aria-current={isActive ? "page" : undefined}
    sx={{
      position: "relative",
      width: "100%",
      justifyContent: "flex-start",
      gap: 1.5,
      px: 1.5,
      py: 1.25,
      borderRadius: 2.5,
      color: isActive ? "common.white" : ON_RAIL,
      bgcolor: isActive ? (theme) => alpha(theme.palette.primary.glow, 0.14) : "transparent",
      "&:hover": { color: "common.white", bgcolor: (theme) => alpha(theme.palette.primary.glow, isActive ? 0.18 : 0.06) },
      "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.glow", outlineOffset: 2 },
    }}
  >
    {isActive && <Box sx={{ position: "absolute", left: -16, top: 10, bottom: 10, width: 4, borderRadius: 4, bgcolor: "primary.glow" }} />}
    <Icon size={20} weight={isActive ? "fill" : "regular"} />
    <Typography component="span" sx={{ fontSize: 14.5, fontWeight: isActive ? 800 : 600 }}>
      {label}
    </Typography>
  </ButtonBase>
);

const Sidebar = ({ destinations }) => {
  const { pathname } = useLocation();
  const { firstName, lastName, avatar, role } = useSelector((state) => state.user.user);

  return (
    <Stack
      component="nav"
      aria-label="Admin"
      sx={{ position: "sticky", top: 0, width: SIDEBAR_WIDTH, height: "100dvh", flexShrink: 0, px: 2, py: 2.5, bgcolor: "chat.rail", color: ON_RAIL }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", px: 1, color: "common.white" }}>
        <Box component="img" src={WhisprlMark} alt="" sx={{ width: 34, height: "auto" }} />
        <Typography component="p" sx={{ m: 0 }}>
          <Wordmark name="Admin" fontSize={28} />
        </Typography>
      </Stack>

      <Stack component="ul" spacing={0.5} sx={{ m: 0, mt: 5, p: 0, listStyle: "none" }}>
        {destinations.map((destination) => (
          <li key={destination.path}>
            <SidebarLink {...destination} isActive={Boolean(matchPath(destination.path, pathname))} />
          </li>
        ))}
      </Stack>

      <Stack spacing={1.5} sx={{ mt: "auto", pt: 2, borderTop: 1, borderColor: alpha(ON_RAIL, 0.15) }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", px: 1 }}>
          {getAvatar(avatar, `${firstName} ${lastName}`, 36)}
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 14, fontWeight: 700, color: "common.white" }}>{`${firstName} ${lastName}`}</Typography>
            <Box sx={{ display: "flex", mt: 0.5 }}>
              <RoleBadge role={role} />
            </Box>
          </Box>
        </Stack>
        <ButtonBase
          component={Link}
          to={PATH_DASHBOARD.general.chat}
          sx={{ justifyContent: "flex-start", gap: 1, px: 1, py: 1, borderRadius: 2, color: ON_RAIL, "&:hover": { color: "common.white" } }}
        >
          <ArrowLeftIcon size={18} weight="bold" />
          <Typography component="span" sx={{ fontSize: 13.5, fontWeight: 700 }}>
            Back to Whisprl
          </Typography>
        </ButtonBase>
      </Stack>
    </Stack>
  );
};

const PhoneNav = ({ destinations }) => {
  const { pathname } = useLocation();
  const activeLink = useRef(null);

  useEffect(() => {
    activeLink.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <Stack
      component="nav"
      aria-label="Admin"
      direction="row"
      spacing={0.5}
      sx={{ px: 1.5, pb: 1.25, overflowX: "auto", scrollbarWidth: "none", scrollPaddingInline: 12 }}
    >
      {destinations.map(({ path, label, Icon }) => {
        const isActive = Boolean(matchPath(path, pathname));
        return (
          <ButtonBase
            key={path}
            ref={isActive ? activeLink : undefined}
            component={Link}
            to={path}
            aria-current={isActive ? "page" : undefined}
            sx={{
              flexShrink: 0,
              gap: 0.75,
              px: 1.5,
              py: 0.75,
              borderRadius: 99,
              color: isActive ? "common.white" : ON_RAIL,
              bgcolor: isActive ? (theme) => alpha(theme.palette.primary.glow, 0.16) : "transparent",
              "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.glow" },
            }}
          >
            <Icon size={16} weight={isActive ? "fill" : "regular"} />
            <Typography component="span" sx={{ fontSize: 13.5, fontWeight: isActive ? 800 : 600 }}>
              {label}
            </Typography>
          </ButtonBase>
        );
      })}
    </Stack>
  );
};

const TopBar = ({ destinations }) => {
  const role = useSelector((state) => state.user.user.role);
  return (
    <Box component="header" sx={{ position: "sticky", top: 0, zIndex: 2, pt: "env(safe-area-inset-top)", bgcolor: "chat.rail", color: "common.white" }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", minHeight: 60, px: 1 }}>
        <Tooltip title="Back to Whisprl">
          <IconButton component={Link} to={PATH_DASHBOARD.general.chat} aria-label="Back to Whisprl" sx={{ color: ON_RAIL, width: 44, height: 44 }}>
            <ArrowLeftIcon size={22} weight="bold" />
          </IconButton>
        </Tooltip>
        <Typography component="p" sx={{ m: 0, flex: 1 }}>
          <Wordmark name="Admin" fontSize={24} />
        </Typography>
        <Box sx={{ pr: 1 }}>
          <RoleBadge role={role} />
        </Box>
      </Stack>
      <PhoneNav destinations={destinations} />
    </Box>
  );
};

// the server refuses anything outside someone's permissions, so this only keeps them from landing on it
const AllowedContent = ({ destinations }) => {
  const { pathname } = useLocation();
  const current = DESTINATIONS.find(({ path }) => matchPath(path, pathname));
  const isRoot = Boolean(matchPath(PATH_ADMIN.root, pathname));

  if (!isRoot && (!current || destinations.includes(current))) return <Outlet />;
  if (destinations.length) return <Navigate to={destinations[0].path} replace />;
  return (
    <Box sx={{ px: { xs: 2, md: 6 }, py: { xs: 1, md: 4 } }}>
      <Notice title="Nothing to open yet">The owner hasn't given you access to any part of the admin panel.</Notice>
    </Box>
  );
};

const AdminLayout = () => {
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const user = useSelector((state) => state.user.user);
  const destinations = DESTINATIONS.filter(({ permission }) => can(user, permission));

  return (
    <Stack direction={{ xs: "column", md: "row" }} sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      {isPhone ? <TopBar destinations={destinations} /> : <Sidebar destinations={destinations} />}
      <Box component="main" sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <PageArea value={PAGE_AREA}>
          <AllowedContent destinations={destinations} />
        </PageArea>
      </Box>
    </Stack>
  );
};

export default AdminLayout;
