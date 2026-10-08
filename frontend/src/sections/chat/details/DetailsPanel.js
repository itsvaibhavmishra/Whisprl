import { Box, Drawer, IconButton, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ArrowLeft, X } from "phosphor-react";
import { useSelector } from "react-redux";

import ChatControls from "@/sections/chat/details/ChatControls";
import GroupDetails from "@/sections/chat/details/GroupDetails";
import PersonDetails from "@/sections/chat/details/PersonDetails";
import QuickActions from "@/sections/chat/details/QuickActions";
import SharedContent from "@/sections/chat/details/SharedContent";
import { useDetailsToggle } from "@/sections/chat/chatRoute";
import { identityOf } from "@/utils/chats";

const DETAILS_WIDTH = 380;
export const DETAILS_SLIDE = { duration: 0.34, ease: [0.32, 0.72, 0, 1] };

const DetailsPanel = ({ open }) => {
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up("lg"));
  const isStill = useReducedMotion();
  const slideFrom = theme.direction === "rtl" ? -48 : 48;
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const conversation = useSelector((state) => state.chat.activeConversation);
  const meId = useSelector((state) => state.user.user._id);
  const details = useDetailsToggle();
  const title = conversation.isGroup ? "Group info" : "Contact info";
  const { name } = identityOf(conversation, meId);
  const sharedContent = <SharedContent conversation={conversation} />;
  const quickActions = <QuickActions conversation={conversation} name={name} />;
  const closeButton = (
    <IconButton aria-label={`Close ${title.toLowerCase()}`} onClick={details.close} sx={{ width: 44, height: 44 }}>
      {isPhone ? <ArrowLeft size={22} weight="bold" /> : <X size={20} weight="bold" />}
    </IconButton>
  );

  const panel = (
    <Stack component="aside" aria-label={title} sx={{ height: "100%", width: { xs: "100vw", sm: DETAILS_WIDTH }, bgcolor: "chat.list" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, minHeight: 64, pt: { xs: "env(safe-area-inset-top)", sm: 0 }, borderBottom: 1, borderColor: "divider" }}>
        {isPhone && closeButton}
        <Typography component="h2" sx={{ flex: 1, pl: isPhone ? 0 : 1, fontSize: 16, fontWeight: 800 }}>
          {title}
        </Typography>
        {!isPhone && closeButton}
      </Stack>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {conversation.isGroup ? (
          <GroupDetails group={conversation} sharedContent={sharedContent} quickActions={quickActions} />
        ) : (
          <PersonDetails conversation={conversation} sharedContent={sharedContent} quickActions={quickActions} />
        )}
        <ChatControls conversation={conversation} />
      </Box>
    </Stack>
  );

  // the column's width grows with the slide, so the chat beside it eases aside instead of jumping
  if (isWide) {
    const transition = isStill ? { duration: 0 } : DETAILS_SLIDE;
    return (
      <AnimatePresence initial={false}>
        {open && (
          <Box
            component={m.div}
            key="details"
            initial={{ width: 0 }}
            animate={{ width: DETAILS_WIDTH + 1 }}
            exit={{ width: 0 }}
            transition={transition}
            sx={{ flexShrink: 0, height: "100%", overflow: "hidden", borderLeft: 1, borderColor: "divider" }}
          >
            <Box
              component={m.div}
              initial={{ x: slideFrom, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: slideFrom, opacity: 0 }}
              transition={transition}
              sx={{ width: DETAILS_WIDTH, height: "100%" }}
            >
              {panel}
            </Box>
          </Box>
        )}
      </AnimatePresence>
    );
  }
  return (
    <Drawer anchor="right" open={open} onClose={details.close} PaperProps={{ sx: { bgcolor: "chat.list" } }}>
      {panel}
    </Drawer>
  );
};

export default DetailsPanel;
