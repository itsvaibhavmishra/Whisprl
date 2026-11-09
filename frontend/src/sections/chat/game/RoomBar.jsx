import { useState } from "react";
import { Box, IconButton, InputBase, Popover, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ChatCircleTextIcon, PaperPlaneRightIcon, SmileyIcon } from "@phosphor-icons/react";
import { useDispatch } from "react-redux";

import EmojiPicker from "@/components/emoji-picker/EmojiPicker";
import { SendTextMessage } from "@/redux/slices/actions/chatActions";
import ReactionTray from "@/sections/chat/game/ReactionTray";
import StickerFaceIcon from "@/sections/chat/game/StickerFaceIcon";

const RoomBar = ({ theme, onOpenChat }) => {
  const dispatch = useDispatch();
  const [text, setText] = useState("");
  const [trayAnchor, setTrayAnchor] = useState(null);
  const [pickerAnchor, setPickerAnchor] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const canSend = Boolean(text.trim());
  // someone in the text box may want to send emoji on their own, so it offers emoji rather than reactions
  const offersEmoji = Boolean(text) || isFocused || Boolean(pickerAnchor);

  const send = (event) => {
    event.preventDefault();
    if (!canSend) return;
    dispatch(SendTextMessage({ text: text.trim() }));
    setText("");
  };

  const roundControl = { color: theme.ink, bgcolor: alpha(theme.card, 0.85), "&:hover": { bgcolor: alpha(theme.card, 0.95) } };

  return (
    <Stack
      component="form"
      onSubmit={send}
      direction="row"
      spacing={1}
      sx={{ alignItems: "center", px: 1.5, pt: 1, pb: "calc(8px + env(safe-area-inset-bottom))" }}
    >
      <IconButton aria-label="Open the chat" onClick={onOpenChat} sx={roundControl}>
        <ChatCircleTextIcon size={22} weight="bold" />
      </IconButton>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", pl: 2, pr: 0.5, borderRadius: 99, bgcolor: alpha(theme.card, 0.85) }}>
        <InputBase
          value={text}
          onChange={(event) => setText(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Say something"
          inputProps={{ "aria-label": "Say something at the table", enterKeyHint: "send", maxLength: 500 }}
          sx={{ flex: 1, minWidth: 0, py: 1, color: theme.ink, fontSize: 15, "& input::placeholder": { color: alpha(theme.ink, 0.65), opacity: 1 } }}
        />
        {offersEmoji ? (
          // pressing it leaves the text box focused, or the button would turn back into the sticker under the tap
          <IconButton
            aria-label="Add an emoji"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => setPickerAnchor(event.currentTarget)}
            sx={{ color: theme.ink }}
          >
            <SmileyIcon size={22} weight="bold" />
          </IconButton>
        ) : (
          <IconButton aria-label="Throw a reaction" onClick={(event) => setTrayAnchor(event.currentTarget)} sx={{ color: theme.ink }}>
            <StickerFaceIcon size={22} />
          </IconButton>
        )}
      </Box>
      {canSend && (
        <IconButton type="submit" aria-label="Send" sx={{ color: "#fff", bgcolor: theme.accent, "&:hover": { bgcolor: theme.accent } }}>
          <PaperPlaneRightIcon size={20} weight="fill" />
        </IconButton>
      )}
      <ReactionTray anchor={trayAnchor} onClose={() => setTrayAnchor(null)} />
      <Popover
        open={Boolean(pickerAnchor)}
        anchorEl={pickerAnchor}
        onClose={() => setPickerAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <EmojiPicker onSelect={(emoji) => setText((typed) => typed + emoji)} autoFocus={false} />
      </Popover>
    </Stack>
  );
};

export default RoomBar;
