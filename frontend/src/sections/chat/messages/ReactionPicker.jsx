import { useState } from "react";
import { Drawer, IconButton, Popover, Stack, Tooltip, useMediaQuery } from "@mui/material";
import { PlusIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";

import { markedSx } from "@/components/emoji-picker/emojiStyles";
import { UpdateChatPreferences } from "@/redux/slices/actions/chatSettingsActions";
import { UpdateQuickReactions } from "@/redux/slices/actions/userActions";
import EmojiPanel, { DESKTOP_PANEL_HEIGHT } from "@/sections/chat/conversation/EmojiPanel";
import { lastKeyboardHeight } from "@/utils/keyboard";
import { quickReactionsOf, swapIn } from "@/utils/reactions";

// a reaction picked from the full list takes the first quick slot, so it can be seen and undone in one tap
const withCurrent = (reactions, current) => (current && !reactions.includes(current) ? [current, ...reactions.slice(0, -1)] : reactions);

export const QuickReactions = ({ current, onPick, onMore }) => {
  const quickReactions = useSelector(({ user, chat }) => quickReactionsOf(user.user, chat.activeConversation));
  const shown = withCurrent(quickReactions, current);

  return (
    <Stack direction="row" role="group" aria-label="React" sx={{ alignItems: "center", p: 0.5 }}>
      {shown.map((emoji) => (
        <IconButton
          key={emoji}
          onClick={() => onPick(emoji)}
          aria-label={`React with ${emoji}`}
          aria-pressed={current === emoji}
          sx={(theme) => ({
            fontSize: 22,
            width: 40,
            height: 40,
            ...(current === emoji && markedSx(theme)),
          })}
        >
          {emoji}
        </IconButton>
      ))}
      <Tooltip title="More reactions">
        <IconButton aria-label="More reactions" onClick={onMore} sx={{ width: 40, height: 40 }}>
          <PlusIcon size={18} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

// the sheet takes the composer's emoji panel's place and size: the chat's column, or the whole window where there is none
const composerColumn = () => {
  const column = document.querySelector("[data-composer-column]")?.getBoundingClientRect();
  return column ? { left: column.left, width: column.width } : { left: 0, width: "100%" };
};

const MoreReactions = ({ current, onPick, onClose }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const conversation = useSelector((state) => state.chat.activeConversation);
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const [baseHeight] = useState(() => (isSmallScreen ? lastKeyboardHeight() : DESKTOP_PANEL_HEIGHT));
  const [editingSlot, setEditingSlot] = useState(null);
  const reactions = quickReactionsOf(user, conversation);
  // a chat with its own six edits those, as they are the ones its quick row shows
  const isChatOwn = Boolean(conversation?.quickReactions?.length);
  const isEditing = editingSlot !== null;
  const shown = withCurrent(reactions, current);

  const save = (next) => dispatch(isChatOwn ? UpdateChatPreferences({ conversationId: conversation._id, quickReactions: next }) : UpdateQuickReactions(next));

  const pinned = {
    title: isChatOwn ? "This chat's reactions" : "Your reactions",
    action: { label: isEditing ? "Done" : "Edit", onClick: () => setEditingSlot(isEditing ? null : 0) },
    emojis: isEditing ? reactions : shown,
    markedIndex: isEditing ? editingSlot : shown.indexOf(current),
    note: isEditing && "Pick an emoji to put in place of the highlighted one",
    keepsOpen: isEditing,
    onPick: (emoji, index) => (isEditing ? setEditingSlot(index) : onPick(emoji)),
  };

  return (
    <EmojiPanel
      baseHeight={baseHeight}
      autoFocus={false}
      pinned={pinned}
      onSelect={(emoji) => (isEditing ? save(swapIn(reactions, editingSlot, emoji)) : onPick(emoji))}
      onClose={onClose}
    />
  );
};

const ReactionPicker = ({ anchorEl, current, startsBrowsing = false, onPick, onClose }) => {
  const [isBrowsing, setIsBrowsing] = useState(false);
  const isOpen = Boolean(anchorEl);
  const showsList = isBrowsing || startsBrowsing;

  const pick = (emoji) => {
    onPick(emoji);
    onClose();
  };

  return (
    <>
      <Popover
        open={isOpen && !showsList}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{ paper: { sx: { borderRadius: 99, mb: 1 } } }}
      >
        <QuickReactions current={current} onPick={pick} onMore={() => setIsBrowsing(true)} />
      </Popover>
      <Drawer
        anchor="bottom"
        open={isOpen && showsList}
        onClose={onClose}
        slotProps={{
          // every message has a picker, so only one showing its sheet measures the page
          paper: { sx: { ...(showsList && composerColumn()), right: "auto", bgcolor: "transparent", backgroundImage: "none", boxShadow: "none" } },
          // the sheet stays the sheet until it has slid away, so closing never flashes the quick row
          transition: { onExited: () => setIsBrowsing(false) },
        }}
      >
        <MoreReactions current={current} onPick={pick} onClose={onClose} />
      </Drawer>
    </>
  );
};

export default ReactionPicker;
