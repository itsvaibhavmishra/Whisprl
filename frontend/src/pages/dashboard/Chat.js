import { useEffect, useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { m } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";

import LoadingScreen from "@/components/LoadingScreen";
import useBackPreview from "@/hooks/useBackPreview";
import useIsLoading from "@/hooks/useIsLoading";
import { PAGE_HEIGHT_WITH_TAB_BAR, TabBar } from "@/layouts/dashboard/NavRail";
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

// while a back swipe is held, the list shows under the swipe's pictures and the chat hides without losing its place
const PREVIEWING = "html[data-back-preview] &";
const LIST_IN_PREVIEW = { display: "block", position: "absolute", inset: 0, zIndex: 1, width: "100%", bgcolor: "chat.list" };

// on a phone the list and the open chat are separate screens, and the bottom navigation steps aside inside a chat
const Chat = () => {
  useChatRouteSync();
  const dispatch = useDispatch();
  const activeConversation = useSelector((state) => state.chat.activeConversation);
  const { chatId, isInfo } = useChatAddress();
  const isStartingChat = useIsLoading(CreateOpenConversation);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const isWide = useMediaQuery((theme) => theme.breakpoints.up("md"));

  useEffect(() => {
    dispatch(GetFriends());
  }, [dispatch]);

  const openGroupDialog = () => setIsCreatingGroup(true);
  const isChatOpen = Boolean(activeConversation);
  // only the address picks a phone's screen, so a refreshed chat waits in place and one opened from search slides in once its address follows
  const isChatShown = Boolean(chatId);
  const isPreviewable = isChatShown && !isWide;
  useBackPreview(isPreviewable);

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
        position: "relative",
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
          ...(isPreviewable && { [PREVIEWING]: LIST_IN_PREVIEW }),
        }}
      >
        <Box sx={{ height: "100%", ...(isPreviewable && { [PREVIEWING]: { height: PAGE_HEIGHT_WITH_TAB_BAR } }) }}>
          <ChatList onNewGroup={openGroupDialog} />
        </Box>
        {isPreviewable && (
          <Box sx={{ display: "none", [PREVIEWING]: { display: "block" } }}>
            <TabBar />
          </Box>
        )}
      </Box>

      <Box
        component="main"
        sx={{ display: { xs: isChatShown ? "block" : "none", md: "block" }, flex: 1, minWidth: 0, position: "relative", ...(isPreviewable && { [PREVIEWING]: { visibility: "hidden" } }) }}
      >
        {/* a computer fades, since a transform would cut the bubbles' fixed gradient loose; a phone slides the whole screen */}
        <m.div key={activeConversation?._id ?? "none"} initial={isWide && { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }} style={{ height: "100%" }}>
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
