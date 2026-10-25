import { Box, ButtonBase, Popover, Typography } from "@mui/material";
import { useDispatch } from "react-redux";

import { ReactInGame } from "@/redux/slices/actions/gameActions";
import ReactionEmoji from "@/sections/chat/game/ReactionEmoji";
import { REACTIONS } from "@/utils/gameRoomEvents";

// emoji thrown at the table: everyone at the game sees it for a moment, and nobody keeps it
const ReactionTray = ({ anchor, onClose }) => {
  const dispatch = useDispatch();
  // the phone's bar sits at the foot and a computer's at the top, so the tray opens toward the middle of the screen
  const isLow = anchor ? anchor.getBoundingClientRect().top > window.innerHeight / 2 : true;
  return (
    <Popover
      open={Boolean(anchor)}
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: isLow ? "top" : "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: isLow ? "bottom" : "top", horizontal: "center" }}
      slotProps={{ paper: { sx: { my: 1, p: 1, borderRadius: 4, bgcolor: "rgba(20, 24, 40, 0.94)", boxShadow: "0 12px 32px rgba(0, 0, 0, 0.45)" } } }}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 80px)", gap: 0.5 }}>
        {REACTIONS.map(({ emoji, name }) => (
          <ButtonBase
            key={emoji}
            aria-label={`Throw ${name.toLowerCase()} ${emoji}`}
            onClick={() => {
              dispatch(ReactInGame(emoji));
              onClose();
            }}
            sx={{
              flexDirection: "column",
              gap: 0.5,
              py: 1,
              borderRadius: 3,
              "&:hover, &.Mui-focusVisible": { bgcolor: "rgba(255, 255, 255, 0.08)" },
            }}
          >
            <ReactionEmoji emoji={emoji} size={44} />
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "rgba(255, 255, 255, 0.75)", lineHeight: 1 }}>{name}</Typography>
          </ButtonBase>
        ))}
      </Box>
    </Popover>
  );
};

export default ReactionTray;
