import { ButtonBase, Popover, Stack } from "@mui/material";
import { useDispatch } from "react-redux";

import { ReactInGame } from "@/redux/slices/actions/gameActions";
import { REACTIONS } from "@/utils/gameRoomEvents";

// emoji thrown at the table: everyone at the game sees it for a moment, and nobody keeps it
const ReactionTray = ({ anchor, onClose }) => {
  const dispatch = useDispatch();
  return (
    <Popover
      open={Boolean(anchor)}
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      PaperProps={{ sx: { mb: 1, borderRadius: 99, px: 0.75, py: 0.5, bgcolor: "rgba(20, 24, 40, 0.94)" } }}
    >
      <Stack direction="row">
        {REACTIONS.map((emoji) => (
          <ButtonBase
            key={emoji}
            aria-label={`React with ${emoji}`}
            onClick={() => {
              dispatch(ReactInGame(emoji));
              onClose();
            }}
            sx={{ width: 40, height: 40, borderRadius: "50%", fontSize: 24, transition: "transform 120ms ease", "&:hover, &.Mui-focusVisible": { transform: "scale(1.2)" } }}
          >
            {emoji}
          </ButtonBase>
        ))}
      </Stack>
    </Popover>
  );
};

export default ReactionTray;
