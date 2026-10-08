import { useState } from "react";
import {
  Stack,
  Box,
  Tab,
  Tabs,
  useTheme,
  IconButton,
  Typography,
} from "@mui/material";
import { ArrowCircleLeft } from "phosphor-react";

import FriendRequests from "@/sections/contacts/FriendRequests";
import SearchUsers from "@/sections/contacts/SearchUsers";
import SentRequests from "@/sections/contacts/SentRequests";

// redux imports
import { useDispatch } from "react-redux";
import { setShowFriendsMenu } from "@/redux/slices/userSlice";

const FriendsMenu = () => {
  const theme = useTheme();

  // from redux
  const dispatch = useDispatch();

  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const isSearchTab = tabIndex === 1;

  return (
    <Stack height={"100%"}>
      {/* Header */}
      <Box
        p={2}
        width={"100%"}
        sx={{
          backgroundColor: theme.palette.background.default,
          boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
          position: "relative",
        }}
      >
        <Stack
          direction={"row"}
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          <Typography variant="h5">Let's make new friends</Typography>
          {/* Close Icon */}
          <IconButton
            sx={{ display: { xs: "flex", md: "none" } }}
            onClick={() => dispatch(setShowFriendsMenu())}
          >
            <ArrowCircleLeft />
          </IconButton>
        </Stack>
      </Box>

      {/* Tabs */}
      <Stack alignItems={"center"} p={"2"}>
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Friend Requests" disableRipple />

          <Tab label="Search Users" disableRipple />

          <Tab label="Sent Requests" disableRipple />
        </Tabs>
      </Stack>

      {/* Sections */}
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        height={"100%"}
        spacing={2}
        p={2}
        sx={{
          flexGrow: !isSearchTab ? 1 : 0,
          overflow: "scroll",
          height: "100%",
          overflowY: !isSearchTab ? "auto" : "hidden",
          overflowX: "hidden",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {tabIndex === 0 && <FriendRequests />}
        {tabIndex === 1 && <SearchUsers />}
        {tabIndex === 2 && <SentRequests />}
      </Stack>
    </Stack>
  );
};
export default FriendsMenu;
