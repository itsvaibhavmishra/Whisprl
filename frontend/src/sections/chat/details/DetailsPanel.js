import { Box, Drawer, IconButton, Stack, Typography, useMediaQuery } from "@mui/material";
import { X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { setDetailsOpen } from "@/redux/slices/chatSlice";
import ChatControls from "@/sections/chat/details/ChatControls";
import GroupDetails from "@/sections/chat/details/GroupDetails";
import PersonDetails from "@/sections/chat/details/PersonDetails";
import SharedContent from "@/sections/chat/details/SharedContent";

const DETAILS_WIDTH = 360;

const DetailsPanel = () => {
  const dispatch = useDispatch();
  const isWide = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const conversation = useSelector((state) => state.chat.activeConversation);
  const close = () => dispatch(setDetailsOpen(false));
  const title = conversation.isGroup ? "Group info" : "Contact info";
  const sharedContent = <SharedContent conversation={conversation} />;

  const panel = (
    <Stack
      component="aside"
      aria-label={title}
      sx={{ height: "100%", width: { xs: "100vw", sm: DETAILS_WIDTH }, bgcolor: "background.default" }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, minHeight: 64, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <IconButton aria-label={`Close ${title.toLowerCase()}`} onClick={close}>
          <X size={20} />
        </IconButton>
      </Stack>
      <Box sx={{ flex: 1, overflowY: "auto", pt: 2 }} className="scrollbar">
        {conversation.isGroup ? (
          <GroupDetails group={conversation} sharedContent={sharedContent} />
        ) : (
          <PersonDetails conversation={conversation} sharedContent={sharedContent} />
        )}
        <ChatControls conversation={conversation} />
      </Box>
    </Stack>
  );

  if (isWide) return <Box sx={{ flexShrink: 0, borderLeft: 1, borderColor: "divider", height: "100%" }}>{panel}</Box>;
  return (
    <Drawer anchor="right" open onClose={close}>
      {panel}
    </Drawer>
  );
};

export default DetailsPanel;
