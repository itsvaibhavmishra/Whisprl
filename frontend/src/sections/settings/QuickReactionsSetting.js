import { useState } from "react";
import { Button, IconButton, Popover, Stack, Tooltip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import EmojiPicker from "@/components/EmojiPicker";
import { UpdateQuickReactions } from "@/redux/slices/actions/userActions";
import { SettingRow } from "@/sections/settings/SettingsSection";
import { DEFAULT_QUICK_REACTIONS, quickReactionsOf } from "@/utils/reactions";

// choosing an emoji already in the bar swaps the two, so the six always stay different
const swapIn = (reactions, position, emoji) => {
  const next = [...reactions];
  const existing = next.indexOf(emoji);
  if (existing !== -1) next[existing] = next[position];
  next[position] = emoji;
  return next;
};

const QuickReactionsSetting = () => {
  const dispatch = useDispatch();
  const reactions = useSelector((state) => quickReactionsOf(state.user.user));
  const [editing, setEditing] = useState(null);

  const save = (next) => dispatch(UpdateQuickReactions(next));
  const isDefault = reactions.join() === DEFAULT_QUICK_REACTIONS.join();

  return (
    <SettingRow
      label="Quick reactions"
      description="The six you see first when reacting. Double click or double tap a message to send the first one."
    >
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: "wrap" }}>
        {reactions.map((emoji, position) => (
          <Tooltip key={emoji} title={position === 0 ? "Sent on double click" : "Change"}>
            <IconButton
              aria-label={`Change quick reaction ${position + 1}, now ${emoji}`}
              onClick={(event) => setEditing({ position, anchor: event.currentTarget })}
              sx={{ fontSize: 22, width: 42, height: 42, border: 1, borderColor: position === 0 ? "primary.main" : "divider" }}
            >
              {emoji}
            </IconButton>
          </Tooltip>
        ))}
        {!isDefault && (
          <Button size="small" color="inherit" onClick={() => save(DEFAULT_QUICK_REACTIONS)}>
            Reset
          </Button>
        )}
      </Stack>
      <Popover
        open={Boolean(editing)}
        anchorEl={editing?.anchor}
        onClose={() => setEditing(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <EmojiPicker
          onSelect={(emoji) => {
            save(swapIn(reactions, editing.position, emoji));
            setEditing(null);
          }}
        />
      </Popover>
    </SettingRow>
  );
};

export default QuickReactionsSetting;
