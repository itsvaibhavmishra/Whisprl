import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { m } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";

import LoadingScreen from "@/components/LoadingScreen";
import useIsLoading from "@/hooks/useIsLoading";
import { PAGE_HEIGHT_WITH_TAB_BAR } from "@/layouts/dashboard/NavRail";
import { CreateOpenConversation } from "@/redux/slices/actions/chatActions";
import { GetFriends } from "@/redux/slices/actions/userActions";
import EmptyChat from "@/sections/chat/EmptyChat";
import Conversation from "@/sections/chat/conversation/Conversation";
import DetailsPanel from "@/sections/chat/details/DetailsPanel";
import CreateGroupDialog from "@/sections/chat/group/CreateGroupDialog";
import ChatList from "@/sections/chat/list/ChatList";
import { useChatAddress, useChatRouteSync } from "@/sections/chat/chatRoute";
import WhatsNewDialog from "@/sections/whats-new/WhatsNewDialog";

const LIST_WIDTH = { md: 340, lg: 380 };

// on a phone the list and the open chat are separate screens, and the bottom navigation steps aside inside a chat
const Chat = () => {
  useChatRouteSync();
  const dispatch = useDispatch();
  const activeConversation = useSelector((state) => state.chat.activeConversation);
  const { chatId, isInfo } = useChatAddress();
  const isStartingChat = useIsLoading(CreateOpenConversation);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => {
    dispatch(GetFriends());
  }, [dispatch]);

  const openGroupDialog = () => setIsCreatingGroup(true);
  const isChatOpen = Boolean(activeConversation);
  // the address decides which screen a phone shows, so a refreshed chat waits for its list in place
  const isChatShown = isChatOpen || Boolean(chatId);

  const conversationPane = () => {
    if (isChatOpen) return <Conversation />;
    if (isStartingChat || chatId) return <LoadingScreen fromChat />;
    return <EmptyChat onNewGroup={openGroupDialog} />;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexGrow: 1,
        minWidth: 0,
        height: { xs: isChatShown ? "100dvh" : PAGE_HEIGHT_WITH_TAB_BAR, md: "100dvh" },
        bgcolor: "chat.list",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: { xs: isChatShown ? "none" : "block", md: "block" },
          width: { xs: "100%", ...LIST_WIDTH },
          flexShrink: 0,
          // the colour rides in the same declaration, since a responsive border shorthand would reset it to the text colour
          borderRight: (theme) => ({ xs: "none", md: `1px solid ${theme.palette.divider}` }),
        }}
      >
        <ChatList onNewGroup={openGroupDialog} />
      </Box>

      <Box component="main" sx={{ display: { xs: isChatShown ? "block" : "none", md: "block" }, flex: 1, minWidth: 0, position: "relative" }}>
        {/* a fade, not a slide, since a transform here would cut the bubbles' fixed gradient loose */}
        <m.div key={activeConversation?._id ?? "none"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }} style={{ height: "100%" }}>
          {conversationPane()}
        </m.div>
      </Box>

      {isChatOpen && <DetailsPanel open={isInfo} />}

      <CreateGroupDialog open={isCreatingGroup} onClose={() => setIsCreatingGroup(false)} />
      <WhatsNewDialog />
    </Box>
  );
};

export default Chat;
