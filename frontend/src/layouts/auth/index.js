import { useEffect, useState } from "react";
import { Box, Grow, IconButton, Stack, Tooltip } from "@mui/material";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowsCounterClockwise } from "phosphor-react";

import whisprlMark from "@/assets/icons/logo/WhisprlMark.webp";
import AppearanceMenu from "@/components/AppearanceMenu";
import BrandPanel from "@/layouts/auth/BrandPanel";
import { StartServer } from "@/redux/slices/actions/authActions";
import { PATH_AUTH } from "@/routes/paths";
import useIsLoading from "@/hooks/useIsLoading";

const SLOW_START_AFTER = 10000;

const AuthLayout = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  // a free server can take a while to wake, so the wake-up call is what offers a reload
  const isLoading = useIsLoading(StartServer);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setShowReload(true), SLOW_START_AFTER);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    dispatch(StartServer());
  }, [dispatch]);

  if (isLoggedIn) {
    return <Navigate to={"/"} />;
  }

  if (pathname.replace(/\/+$/, "") === PATH_AUTH.general.welcome) {
    return <Outlet />;
  }

  const reloadWithFreshState = () => {
    setShowReload(false);
    localStorage.removeItem("redux-root");
    window.location.reload();
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { md: "5fr 7fr" },
        minHeight: "100vh",
      }}
    >
      <BrandPanel />

      <Stack sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, md: 6 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box component={Link} to={PATH_AUTH.general.welcome} sx={{ display: { xs: "flex", md: "none" } }}>
            <Box component="img" src={whisprlMark} alt="Whisprl home" width={48} height={52} />
          </Box>
          <Box sx={{ ml: "auto" }}>
            <AppearanceMenu />
          </Box>
        </Stack>
        <Box component="main" sx={{ width: "100%", maxWidth: 420, mx: "auto", my: "auto", py: 4 }}>
          <Outlet />
        </Box>
      </Stack>

      <Grow in={showReload}>
        <Tooltip title="Taking a while? Reload" placement="left">
          <IconButton
            onClick={reloadWithFreshState}
            aria-label="Reload Whisprl"
            sx={{
              position: "fixed",
              bottom: 16,
              right: 16,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            <ArrowsCounterClockwise />
          </IconButton>
        </Tooltip>
      </Grow>
    </Box>
  );
};

export default AuthLayout;
