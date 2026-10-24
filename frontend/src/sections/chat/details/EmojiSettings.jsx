import { useState } from "react";
import { Box, Button, IconButton, Popover, Stack, Tooltip, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import EmojiPicker from "@/components/EmojiPicker";
import QuickReactionSlots from "@/components/QuickReactionSlots";
import { UpdateChatPreferences } from "@/redux/slices/actions/chatSettingsActions";
import { DetailsSection } from "@/sections/chat/details/DetailsSection";
import { quickEmojiOf } from "@/utils/emoji";
import { quickReactionsOf } from "@/utils/reactions";

const Field = ({ label, description, children }) => (
  <Box>
    <Typography component="h4" sx={{ m: 0, fontSize: 14, fontWeight: 700 }}>
      {label}
    </Typography>
    <Typography sx={{ mb: 1, fontSize: 12.5, color: "text.secondary" }}>{description}</Typography>
    {children}
  </Box>
);

const EmojiSettings = ({ conversation }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [anchor, setAnchor] = useState(null);

  const quickEmoji = quickEmojiOf(conversation);
  const save = (changes) => dispatch(UpdateChatPreferences({ conversationId: conversation._id, ...changes }));
  const pickEmoji = (emoji) => {
    save({ quickEmoji: emoji });
    setAnchor(null);
  };

  return (
    <DetailsSection title="Emoji and reactions">
      <Stack spacing={2.5} sx={{ px: 1.5, pb: 3 }}>
        <Field label="Quick emoji" description="Tap the button beside the message box to send it, or hold to send it bigger.">
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title="Change">
              <IconButton
                aria-label={`Change the quick emoji, now ${quickEmoji}`}
                onClick={(event) => setAnchor(event.currentTarget)}
                sx={{ fontSize: 26, width: 52, height: 52, border: 1, borderColor: "primary.main" }}
              >
                {quickEmoji}
              </IconButton>
            </Tooltip>
            {conversation.quickEmoji && (
              <Button size="small" color="inherit" aria-label="Reset the quick emoji" onClick={() => save({ quickEmoji: null })}>
                Reset
              </Button>
            )}
          </Stack>
        </Field>

        <Field label="Quick reactions" description="The six offered when you react to a message here, in place of the ones from Settings.">
          <QuickReactionSlots
            reactions={quickReactionsOf(user, conversation)}
            onChange={(next) => save({ quickReactions: next })}
            onReset={conversation.quickReactions?.length ? () => save({ quickReactions: null }) : undefined}
          />
        </Field>
      </Stack>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <EmojiPicker onSelect={pickEmoji} />
      </Popover>
    </DetailsSection>
  );
};

export default EmojiSettings;
