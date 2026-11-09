import { Avatar, Box, Button, Stack, Typography } from "@mui/material";

import WhisprlMark from "@/assets/icons/logo/WhisprlMark.webp";
import NoticeText from "@/sections/chat/messages/NoticeText";

// drawn the way Whisprl's chat draws it, so what staff see is what everyone gets
const AnnouncementPreview = ({ text, button }) => (
  <Box sx={{ p: 2, borderRadius: 3, bgcolor: "chat.canvas", minHeight: 120 }}>
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end" }}>
      <Avatar src={WhisprlMark} alt="" sx={{ width: 28, height: 28 }} />
      <Box
        sx={{
          minWidth: 0,
          maxWidth: 420,
          px: 1.5,
          py: 1,
          borderRadius: "18px 18px 18px 6px",
          bgcolor: "chat.bubbleIn",
          boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.chat.edge}, 0 1px 2px ${theme.palette.chat.shade}`,
        }}
      >
        {text.trim() ? (
          <NoticeText text={text.trim()} sx={{ fontSize: 15, fontWeight: 500, lineHeight: 1.45 }} />
        ) : (
          <Typography sx={{ fontSize: 15, color: "text.secondary" }}>Your message shows here</Typography>
        )}
      </Box>
    </Stack>
    {button?.label.trim() && (
      <Button variant="outlined" size="small" tabIndex={-1} sx={{ mt: 0.5, ml: 4.5, borderRadius: 99, pointerEvents: "none" }}>
        {button.label.trim()}
      </Button>
    )}
  </Box>
);

export default AnnouncementPreview;
