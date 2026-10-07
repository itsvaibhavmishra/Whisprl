import { useState } from "react";
import { Box, ButtonBase, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { PushPinSlash } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { UnpinMessage } from "@/redux/slices/actions/messageActions";
import { focusMessage } from "@/redux/slices/chatSlice";
import { GLASS_BAR } from "@/sections/chat/conversation/ConversationHeader";
import { summaryOf } from "@/utils/messageSummary";

// opening a pin jumps to it and moves on to the next, so every pin is a tap away
const PinnedBar = () => {
  const dispatch = useDispatch();
  const conversation = useSelector((state) => state.chat.activeConversation);
  const [turn, setTurn] = useState(0);

  const isBeforeClearing = (message) => conversation.clearedAt && new Date(message.createdAt) <= new Date(conversation.clearedAt);
  const pins = (conversation.pins ?? []).filter((pin) => pin.message && !pin.message.deletedAt && !isBeforeClearing(pin.message)).reverse();
  if (!pins.length) return null;

  const position = turn % pins.length;
  const { message } = pins[position];

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ ...GLASS_BAR, px: { xs: 1.5, md: 2.5 }, py: 0.75 }}
    >
      <ButtonBase
        onClick={() => {
          dispatch(focusMessage(message._id));
          setTurn((count) => count + 1);
        }}
        sx={{ flex: 1, minWidth: 0, gap: 1.5, justifyContent: "flex-start", textAlign: "left", borderRadius: 1, py: 0.25 }}
      >
        <Stack spacing={0.25} sx={{ alignSelf: "stretch", py: 0.25 }} aria-hidden>
          {pins.map((pin, index) => (
            <Box
              key={pin.message._id}
              sx={{ width: 3, flex: 1, borderRadius: 2, bgcolor: index === position ? "primary.main" : "divider" }}
            />
          ))}
        </Stack>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: "primary.main" }}>
            {pins.length > 1 ? `Pinned message ${position + 1} of ${pins.length}` : "Pinned message"}
          </Typography>
          <Typography noWrap sx={{ fontSize: 14, fontWeight: 500 }}>
            {summaryOf(message) || "Message"}
          </Typography>
        </Box>
      </ButtonBase>
      <Tooltip title="Unpin">
        <IconButton
          size="small"
          aria-label="Unpin this message"
          onClick={() => dispatch(UnpinMessage({ _id: message._id, conversation: conversation._id }))}
        >
          <PushPinSlash size={18} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export default PinnedBar;
