import { Button, Stack, Typography } from "@mui/material";
import { LockSimple } from "phosphor-react";

import Wordmark from "@/components/Wordmark";
import ChatCanvas from "@/sections/chat/ChatCanvas";

const EmptyChat = ({ onNewGroup }) => (
  <ChatCanvas sx={{ height: "100%", display: "grid", placeItems: "center", px: 3 }}>
    <Stack alignItems="center" spacing={2} sx={{ textAlign: "center", maxWidth: 420, bgcolor: "background.paper", borderRadius: 4, p: 4 }}>
      <Wordmark name="Whisprl" fontSize={{ xs: "3rem", md: "4rem" }} />
      <Typography sx={{ color: "text.secondary" }}>Pick a chat to carry on, or start a group with your friends.</Typography>
      <Button variant="contained" onClick={onNewGroup}>
        New group
      </Button>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "text.secondary" }}>
        <LockSimple size={14} aria-hidden />
        <Typography variant="caption">Your messages are end-to-end encrypted.</Typography>
      </Stack>
    </Stack>
  </ChatCanvas>
);

export default EmptyChat;
