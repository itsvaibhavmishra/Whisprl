import { useEffect } from "react";
import { Stack, Box, useTheme, useMediaQuery } from "@mui/material";

// redux imports
import { useSelector, useDispatch } from "react-redux";

import ContactList from "@/sections/contacts/ContactList";
import FriendsMenu from "@/sections/contacts/FriendsMenu";
import { GetFriends } from "@/redux/slices/actions/userActions";
import LoadingScreen from "@/components/LoadingScreen";
import useIsLoading from "@/hooks/useIsLoading";

const Contact = () => {
  const theme = useTheme();
  // from redux
  const { user, showFriendsMenu, friends } = useSelector(
    (state) => state.user
  );
  const isLoading = useIsLoading(GetFriends) && !friends.length;
  const dispatch = useDispatch();

  useEffect(() => {
    if (user._id) {
      dispatch(GetFriends());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user._id, showFriendsMenu]);

  // breakpoint
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));

  return (
    <Stack
      direction={"row"}
      sx={{
        width: "100%",
        height: {
          xs: "calc(100vh - 65px)",
          md: "100vh",
        },
      }}
    >
      {/* Contacts area */}
      <Box
        sx={{
          display: {
            xs: showFriendsMenu ? "none" : "block",
            md: "block",
          },
          height: "100%",
          width: { xs: "100%", md: 320 },
          backgroundColor: theme.palette.background.default,
          boxShadow: "0px 0px 2px #00000040",
          overflow: "hidden",
        }}
      >
        {isLoading && isSmallScreen ? <LoadingScreen /> : <ContactList />}
      </Box>

      {/* initializing height and width for conversation area */}
      <Box
        sx={{
          display: {
            xs: showFriendsMenu ? "block" : "none",
            md: "block",
          },
          height: "100%",
          width: { xs: "100%", md: "calc(100vw - 400px)" },
          transition: "width 0.1s ease-in-out",
          backgroundColor: theme.palette.background.paper,
          overflow: "hidden",
        }}
      >
        <FriendsMenu />
      </Box>
    </Stack>
  );
};

export default Contact;
