import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Box,
  useTheme,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Typography,
  useMediaQuery,
  Tooltip,
  capitalize,
} from "@mui/material";
import { SignOut } from "phosphor-react";

// redux imports
import { useSelector, useDispatch } from "react-redux";
import { LogoutUser } from "../../redux/slices/actions/authActions";

import WhisprlLogo from "../../assets/icons/logo/Whisprl.png";
import { Nav_Buttons, Profile_Menu } from "../../data";
import ThemeSwitch from "../../components/ThemeSwitch";
import useSettings from "../../hooks/useSettings";
import getAvatar from "../../utils/createAvatar";

const Sidebar = () => {
  // using redux
  const dispatch = useDispatch();

  const { activeConversation } = useSelector((state) => state.chat);
  const { avatar, firstName } = useSelector((state) => state.user.user);

  const theme = useTheme();

  // Selected Menu
  const [selected, setSelected] = useState();

  //   ThemeSwitch
  const { onToggleMode } = useSettings(); // useSettings from custom hooks
  const [isSwitchChecked, setIsSwitchChecked] = useState(
    theme.palette.mode === "light"
  );

  const location = useLocation();

  // function to determine the selected index based on the current path
  const getSelectedIndex = (path) => {
    if (path.startsWith("/profile")) {
      return 0;
    } else if (path.startsWith("/app")) {
      return 1;
    } else if (path.startsWith("/group")) {
      return 2;
    } else if (path.startsWith("/contact")) {
      return 3;
    } else if (path.startsWith("/settings")) {
      return 4;
    }
  };

  // Update the selected state based on the current location path
  useEffect(() => {
    setSelected(getSelectedIndex(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    setIsSwitchChecked(theme.palette.mode === "light");
  }, [theme.palette.mode]);

  //   Avatar Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // breakpoint
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));

  return (
    <>
      <Box
        p={3}
        sx={{
          display: {
            xs:
              activeConversation && location.pathname.startsWith("/app")
                ? "none"
                : "block",
            md: "block",
          },
          height: { xs: "65px", md: "100vh" },
          width: { xs: "100vw", md: "80px" },
          boxShadow: "0px 0px 2px #00000040",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Stack
          direction={isSmallScreen ? "row" : "column"}
          sx={{ height: "100%" }}
          alignItems="center"
          spacing={isSmallScreen ? 0 : 4}
          mx={isSmallScreen ? -2 : 0}
          justifyContent={isSmallScreen ? "space-around" : "space-between"}
        >
          {/* Sidebar Logo */}
          <Box
            sx={{
              backgroundColor: theme.palette.primary.lighterFaded,
              height: 54,
              width: 54,
              borderRadius: 1.5,
            }}
            hidden={isSmallScreen}
          >
            <a
              href="https://github.com/itsvaibhavmishra/Whisprl"
              target="_blank"
              rel={"noreferrer"}
            >
              <Box
                component={"img"}
                src={WhisprlLogo}
                alt="Whisprl_Logo"
                sx={{ padding: "2px 0px" }}
              />
            </a>
          </Box>

          {/* Center Menus */}
          {isSmallScreen ? (
            Nav_Buttons.map((e) =>
              e.index === selected ? (
                <Tooltip
                  title={capitalize(e.address)}
                  placement="top"
                  key={e.index}
                >
                  <Box
                    p={0.5}
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 1,
                    }}
                  >
                    <Link to={e.address}>
                      <IconButton sx={{ width: "max-content", color: "#fff" }}>
                        {e.icon}
                      </IconButton>
                    </Link>
                  </Box>
                </Tooltip>
              ) : (
                <Tooltip
                  title={capitalize(e.address)}
                  placement="top"
                  key={e.index}
                >
                  <Link to={e.address}>
                    <IconButton
                      onClick={() => setSelected(e.index)}
                      key={e.index}
                      sx={{
                        width: "100%",
                        color:
                          theme.palette.mode === "dark"
                            ? theme.palette.text.primary
                            : "#000",
                      }}
                    >
                      {e.icon}
                    </IconButton>
                  </Link>
                </Tooltip>
              )
            )
          ) : (
            <Stack
              direction={"column"}
              spacing={3}
              alignItems="center"
              sx={{ width: "max-content" }}
              display={"flex"}
            >
              {Nav_Buttons.map((e) =>
                e.index === selected ? (
                  <Box
                    p={0.8}
                    key={e.index}
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 5,
                    }}
                  >
                    <Link to={e.address}>
                      <IconButton sx={{ width: "max-content", color: "#fff" }}>
                        {e.icon}
                      </IconButton>
                    </Link>
                  </Box>
                ) : (
                  <Tooltip
                    title={capitalize(e.address)}
                    placement="right"
                    key={e.index}
                  >
                    <Link to={e.address}>
                      <IconButton
                        onClick={() => setSelected(e.index)}
                        key={e.index}
                        sx={{
                          width: "100%",
                          color:
                            theme.palette.mode === "dark"
                              ? theme.palette.text.primary
                              : "#000",
                        }}
                      >
                        {e.icon}
                      </IconButton>
                    </Link>
                  </Tooltip>
                )
              )}
            </Stack>
          )}

          {/* Sidebar Final Index */}
          {isSmallScreen ? (
            <>
              <IconButton
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
              >
                {getAvatar(avatar, firstName, theme, 35)}
              </IconButton>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
              >
                <Stack spacing={0.5}>
                  {Profile_Menu.map((menuItem, index) => (
                    <MenuItem
                      key={index}
                      onClick={handleClose}
                      component={Link}
                      to={menuItem.address}
                    >
                      <Stack
                        direction={"row"}
                        sx={{ width: 130 }}
                        px={1}
                        alignItems={"center"}
                        justifyContent={"space-between"}
                      >
                        <Typography variant="body1">
                          {menuItem.title}
                        </Typography>

                        {menuItem.icon}
                      </Stack>
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      dispatch(LogoutUser());
                      handleClose();
                    }}
                  >
                    <Stack
                      direction={"row"}
                      sx={{ width: 130 }}
                      px={1}
                      alignItems={"center"}
                      justifyContent={"space-between"}
                    >
                      <Typography variant="body1">Log Out</Typography>
                      <SignOut />
                    </Stack>
                  </MenuItem>
                </Stack>
              </Menu>
            </>
          ) : (
            <Stack
              spacing={isSmallScreen ? 8 : 4}
              alignItems={"center"}
              direction={isSmallScreen ? "row" : "column"}
            >
              <ThemeSwitch
                onChange={() => {
                  onToggleMode();
                }}
                checked={isSwitchChecked}
              />
              <IconButton
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
              >
                {getAvatar(avatar, firstName, theme)}
              </IconButton>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
              >
                <Stack spacing={0.5}>
                  {Profile_Menu.map((menuItem, index) => (
                    <MenuItem
                      key={index}
                      onClick={handleClose}
                      component={Link}
                      to={menuItem.address}
                    >
                      <Stack
                        direction={"row"}
                        sx={{ width: 130 }}
                        px={1}
                        alignItems={"center"}
                        justifyContent={"space-between"}
                      >
                        <Typography variant="body1">
                          {menuItem.title}
                        </Typography>

                        {menuItem.icon}
                      </Stack>
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      dispatch(LogoutUser());
                      handleClose();
                    }}
                  >
                    <Stack
                      direction={"row"}
                      sx={{ width: 130 }}
                      px={1}
                      alignItems={"center"}
                      justifyContent={"space-between"}
                    >
                      <Typography variant="body1">Log Out</Typography>
                      <SignOut />
                    </Stack>
                  </MenuItem>
                </Stack>
              </Menu>
            </Stack>
          )}
        </Stack>
      </Box>
      <Outlet />
    </>
  );
};

export default Sidebar;
