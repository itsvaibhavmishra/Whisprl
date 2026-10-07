import { Stack, Typography } from "@mui/material";

import TypingDots from "@/components/TypingDots";
import { listOf } from "@/utils/groups";

export const TYPING_BUBBLE_HEIGHT = 40;

const TypingBubble = ({ names, isGroup }) => (
  <Stack
    direction="row"
    alignItems="center"
    spacing={1}
    role="status"
    aria-label={`${listOf(names)} ${names.length === 1 ? "is" : "are"} typing`}
    sx={{
      alignSelf: "flex-start",
      height: TYPING_BUBBLE_HEIGHT,
      px: 1.75,
      borderRadius: "18px 18px 18px 6px",
      bgcolor: "chat.bubbleIn",
      color: "primary.main",
      boxShadow: (theme) => `inset 0 0 0 1px ${theme.palette.chat.edge}, 0 1px 2px ${theme.palette.chat.shade}`,
    }}
  >
    {isGroup && <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>{listOf(names)}</Typography>}
    <TypingDots size={6} />
  </Stack>
);

export default TypingBubble;
