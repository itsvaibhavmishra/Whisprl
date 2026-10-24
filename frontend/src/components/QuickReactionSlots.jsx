import { useState } from "react";
import { Button, IconButton, Popover, Stack, Tooltip } from "@mui/material";

import EmojiPicker from "@/components/EmojiPicker";

// choosing an emoji already in the bar swaps the two, so the six always stay different
const swapIn = (reactions, position, emoji) => {
  const next = [...reactions];
  const existing = next.indexOf(emoji);
  if (existing !== -1) next[existing] = next[position];
  next[position] = emoji;
  return next;
};

const QuickReactionSlots = ({ reactions, onChange, onReset }) => {
  const [editing, setEditing] = useState(null);

  return (
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
      {onReset && (
        <Button size="small" color="inherit" aria-label="Reset quick reactions" onClick={onReset}>
          Reset
        </Button>
      )}
      <Popover
        open={Boolean(editing)}
        anchorEl={editing?.anchor}
        onClose={() => setEditing(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <EmojiPicker
          onSelect={(emoji) => {
            onChange(swapIn(reactions, editing.position, emoji));
            setEditing(null);
          }}
        />
      </Popover>
    </Stack>
  );
};

export default QuickReactionSlots;
