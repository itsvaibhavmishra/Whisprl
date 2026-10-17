import { Box, ButtonBase } from "@mui/material";

import { GLASS_BAR } from "@/sections/chat/conversation/ConversationHeader";

// what is left of the chat's header while a game fills a phone, a full width line that brings it back
const FoldedHeader = ({ onOpen }) => (
  <ButtonBase
    aria-label="Show the chat's header"
    onClick={onOpen}
    sx={{ ...GLASS_BAR, width: "100%", display: "grid", placeItems: "center", pt: "calc(10px + env(safe-area-inset-top))", pb: 1.25 }}
  >
    <Box sx={{ width: 42, height: 4, borderRadius: 99, bgcolor: "text.secondary", opacity: 0.6 }} />
  </ButtonBase>
);

export default FoldedHeader;
