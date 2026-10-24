import { useState } from "react";
import { Button, IconButton, Popover, Stack, Tooltip } from "@mui/material";

import EmojiPicker from "@/components/emoji-picker/EmojiPicker";
import { swapIn } from "@/utils/reactions";

const QuickReactionSlots = ({ reactions, onChange, onReset }) => {
  const [editing, setEditing] = useState(null);

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
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
