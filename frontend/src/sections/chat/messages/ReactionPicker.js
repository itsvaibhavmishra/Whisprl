import { useState } from "react";
import { IconButton, Popover, Stack, Tooltip } from "@mui/material";
import { Plus } from "phosphor-react";
import { useSelector } from "react-redux";

import EmojiPicker from "@/components/EmojiPicker";
import { quickReactionsOf } from "@/utils/reactions";

const ReactionPicker = ({ anchorEl, current, onPick, onClose }) => {
  const quickReactions = useSelector((state) => quickReactionsOf(state.user.user));
  const [isBrowsing, setIsBrowsing] = useState(false);

  const close = () => {
    setIsBrowsing(false);
    onClose();
  };

  const pick = (emoji) => {
    onPick(emoji);
    close();
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={close}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      slotProps={{ paper: { sx: { borderRadius: isBrowsing ? 2 : 99, mb: 1 } } }}
    >
      {isBrowsing ? (
        <EmojiPicker onSelect={pick} />
      ) : (
        <Stack direction="row" alignItems="center" sx={{ p: 0.5 }} role="group" aria-label="React">
          {quickReactions.map((emoji) => (
            <IconButton
              key={emoji}
              onClick={() => pick(emoji)}
              aria-label={`React with ${emoji}`}
              aria-pressed={current === emoji}
              sx={{ fontSize: 22, width: 40, height: 40, bgcolor: current === emoji ? "action.selected" : "transparent" }}
            >
              {emoji}
            </IconButton>
          ))}
          <Tooltip title="More reactions">
            <IconButton aria-label="More reactions" onClick={() => setIsBrowsing(true)} sx={{ width: 40, height: 40 }}>
              <Plus size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Popover>
  );
};

export default ReactionPicker;
