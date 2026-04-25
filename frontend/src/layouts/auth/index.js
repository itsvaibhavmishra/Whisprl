import React, { useEffect, useState } from "react";
import { Container, Stack, IconButton, Grow, Tooltip } from "@mui/material";
import { Navigate, Outlet, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ArrowsCounterClockwise } from "phosphor-react";

import Logo from "../../assets/icons/logo/WhisprlSub.png";
import { StartServer } from "../../redux/slices/actions/authActions";

const AuthLayout = () => {
  const dispatch = useDispatch();
  const { isLoggedIn, isLoading } = useSelector((state) => state.auth);

  const [showClear, setShowClear] = useState(false);

  const handleClearData = () => {
    setShowClear(false);

    localStorage.removeItem("redux-root");
    window.location.reload();
  };

  useEffect(() => {
    const timer = 10000;
    if (isLoading) {
      setTimeout(() => {
        setShowClear(true);
      }, timer);
    }

    return () => {
      clearTimeout(timer);
    };
  }, [isLoading]);

  // start server
  useEffect(() => {
    setTimeout(() => {
      dispatch(StartServer());
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoggedIn) {
    return <Navigate to={"/"} />;
  }

  const welcomeScreen = window.location.pathname === "/auth/welcome";

  return (
    <Container
      sx={{ pt: welcomeScreen ? 0 : 5 }}
      maxWidth={welcomeScreen ? "xl" : "sm"}
    >
      <Stack spacing={5} display={welcomeScreen ? "none" : "flex"}>
        <Stack
          direction={"column"}
          alignItems={"center"}
          sx={{ width: "100%" }}
        >
          <Link to={"/auth/welcome"}>
            <Stack
              component="img"
              src={Logo}
              alt={"Whisprl Logo"}
              sx={{ height: 120, width: 120 }}
            />
          </Link>
        </Stack>

        {/* Trash icon button with tooltip */}
        <Grow in={showClear}>
          <Tooltip title="Click Here to Reload" placement="left">
            <Stack
              sx={{
                position: "absolute",
                top: -30,
                right: 20,
                backgroundColor: (theme) => theme.palette.primary.main,
                borderRadius: 20,
              }}
            >
              <IconButton onClick={handleClearData}>
                <ArrowsCounterClockwise color="#fff" />
              </IconButton>
            </Stack>
          </Tooltip>
        </Grow>
      </Stack>

      <Outlet />
    </Container>
  );
};

export default AuthLayout;
