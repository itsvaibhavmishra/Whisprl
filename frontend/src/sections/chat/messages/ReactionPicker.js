import { useState } from "react";
import { Button, IconButton, Popover, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Plus } from "phosphor-react";
import { useSelector } from "react-redux";

import EmojiPicker from "@/components/EmojiPicker";
import { quickReactionsOf } from "@/utils/reactions";

export const QuickReactions = ({ current, onPick, onMore }) => {
  const quickReactions = useSelector((state) => quickReactionsOf(state.user.user));
  // a reaction picked from the full list takes the first quick slot, so it can be seen and undone in one tap
  const shown = current && !quickReactions.includes(current) ? [current, ...quickReactions.slice(0, -1)] : quickReactions;

  return (
    <Stack direction="row" alignItems="center" sx={{ p: 0.5 }} role="group" aria-label="React">
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
            ...(current === emoji && {
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              boxShadow: `inset 0 0 0 1.5px ${alpha(theme.palette.primary.main, 0.7)}`,
            }),
          })}
        >
          {emoji}
        </IconButton>
      ))}
      <Tooltip title="More reactions">
        <IconButton aria-label="More reactions" onClick={onMore} sx={{ width: 40, height: 40 }}>
          <Plus size={18} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

const ReactionPicker = ({ anchorEl, current, startsBrowsing = false, onPick, onClose }) => {
  const [isBrowsing, setIsBrowsing] = useState(false);
  const showsList = isBrowsing || startsBrowsing;

  const pick = (emoji) => {
    onPick(emoji);
    onClose();
  };

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      // the full list stays until the popover has faded, so closing never flashes the quick row
      TransitionProps={{ onExited: () => setIsBrowsing(false) }}
      slotProps={{ paper: { sx: { borderRadius: showsList ? 2 : 99, mb: 1 } } }}
    >
      {showsList ? (
        <Stack>
          {current && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.75, py: 1, borderBottom: 1, borderColor: "divider" }}>
              <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 700, color: "text.secondary" }}>
                Your reaction <span style={{ fontSize: 18, verticalAlign: "-2px" }}>{current}</span>
              </Typography>
              <Button size="small" color="inherit" onClick={() => pick(current)}>
                Remove
              </Button>
            </Stack>
          )}
          <EmojiPicker onSelect={pick} />
        </Stack>
      ) : (
        <QuickReactions current={current} onPick={pick} onMore={() => setIsBrowsing(true)} />
      )}
    </Popover>
  );
};

export default ReactionPicker;
