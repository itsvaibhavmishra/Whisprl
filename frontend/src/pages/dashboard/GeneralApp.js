import { Stack, Box, Typography, useTheme, useMediaQuery } from "@mui/material";

// redux imports
import { useSelector } from "react-redux";

import ChatsList from "@/sections/chat/ChatsList";
import Conversation from "@/sections/chat/conversation/Conversation";
import NoChat from "@/assets/illustrations/NoChat";
import LoadingScreen from "@/components/LoadingScreen";

const GeneralApp = () => {
  const theme = useTheme();
  const { activeConversation, isLoading } = useSelector((state) => state.chat);

  // breakpoint
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));

  return (
    <Stack
      direction={"row"}
      sx={{
        width: "100%",
        height: {
          xs: activeConversation ? "100vh" : "calc(100vh - 65px)",
          md: "100vh",
        },
      }}
    >
      {/* Chats List area */}
      <Box
        sx={{
          display: {
            xs: activeConversation ? "none" : "block",
            md: "block",
          },
          position: "relative",
          height: "100%",
          width: { xs: "100%", md: 320 },
          backgroundColor: theme.palette.background.default,
          boxShadow: "0px 0px 2px #00000040",
          overflow: "hidden",
        }}
      >
        {isLoading && isSmallScreen ? <LoadingScreen /> : <ChatsList />}
      </Box>

      {/* initializing height and width for conversation area */}
      <Box
        sx={{
          display: {
            xs: activeConversation ? "block" : "none",
            md: "block",
          },
          height: "100%",
          width: { xs: "100%", md: "calc(100vw - 400px)" },
          transition: "width 0.1s ease-in-out",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {isLoading ? (
          <LoadingScreen fromChat={true} />
        ) : activeConversation ? (
          <Conversation />
        ) : (
          // No Chat
          <Stack
            sx={{ height: "100%", width: "100%" }}
            alignItems={"center"}
            justifyContent={"center"}
          >
            <NoChat />
            <Typography variant="subtitle2" sx={{ mt: { xs: -5, md: -10 } }}>
              Select or Start a new Conversation
            </Typography>
          </Stack>
        )}
      </Box>
    </Stack>
  );
};

export default GeneralApp;
