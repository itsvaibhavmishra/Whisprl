import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import LoadingScreen from "@/components/LoadingScreen";
import useIsLoading from "@/hooks/useIsLoading";
import { CreateOpenConversation } from "@/redux/slices/actions/chatActions";
import { GetFriends } from "@/redux/slices/actions/userActions";
import EmptyChat from "@/sections/chat/EmptyChat";
import Conversation from "@/sections/chat/conversation/Conversation";
import DetailsPanel from "@/sections/chat/details/DetailsPanel";
import CreateGroupDialog from "@/sections/chat/group/CreateGroupDialog";
import ChatList from "@/sections/chat/list/ChatList";

const LIST_WIDTH = 360;

// on a phone the list and the open chat are separate screens, and the bottom navigation steps aside inside a chat
const Chat = () => {
  const dispatch = useDispatch();
  const { activeConversation, isDetailsOpen } = useSelector((state) => state.chat);
  const isStartingChat = useIsLoading(CreateOpenConversation);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => {
    dispatch(GetFriends());
  }, [dispatch]);

  const openGroupDialog = () => setIsCreatingGroup(true);
  const isChatOpen = Boolean(activeConversation);

  const conversationPane = () => {
    if (isStartingChat && !isChatOpen) return <LoadingScreen fromChat />;
    if (isChatOpen) return <Conversation key={activeConversation._id} />;
    return <EmptyChat onNewGroup={openGroupDialog} />;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexGrow: 1,
        minWidth: 0,
        height: { xs: isChatOpen ? "100dvh" : "calc(100dvh - 65px)", md: "100dvh" },
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          display: { xs: isChatOpen ? "none" : "block", md: "block" },
          width: { xs: "100%", md: LIST_WIDTH },
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
        }}
      >
        <ChatList onNewGroup={openGroupDialog} />
      </Box>

      <Box component="main" sx={{ display: { xs: isChatOpen ? "block" : "none", md: "block" }, flex: 1, minWidth: 0 }}>
        {conversationPane()}
      </Box>

      {isChatOpen && isDetailsOpen && <DetailsPanel />}

      <CreateGroupDialog open={isCreatingGroup} onClose={() => setIsCreatingGroup(false)} />
    </Box>
  );
};

export default Chat;
