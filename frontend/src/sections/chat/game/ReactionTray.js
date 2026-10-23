import { Box, ButtonBase, Popover, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { useDispatch } from "react-redux";

import { ReactInGame } from "@/redux/slices/actions/gameActions";
import { REACTIONS } from "@/utils/gameRoomEvents";

// each emoji moves the way its face feels, on transform alone, so a tray of them stays smooth
const MOTIONS = {
  Laugh: [
    keyframes`0%, 100% { transform: none; } 20% { transform: translateY(-2px) rotate(-10deg); } 40% { transform: rotate(10deg); } 60% { transform: translateY(-2px) rotate(-6deg); } 80% { transform: rotate(4deg); }`,
    "1.2s",
  ],
  Cry: [keyframes`0%, 100% { transform: none; } 50% { transform: translateY(3px) scale(1.04, 0.94); }`, "1.6s"],
  Taunt: [keyframes`0%, 100% { transform: none; } 25% { transform: rotate(-14deg); } 75% { transform: rotate(14deg); }`, "1.4s"],
  Kiss: [keyframes`0%, 30%, 60%, 100% { transform: none; } 15% { transform: scale(1.18); } 45% { transform: scale(1.12); }`, "1.3s"],
  Cool: [keyframes`0%, 100% { transform: none; } 50% { transform: translateY(-3px) rotate(-8deg); }`, "1.8s"],
  Angry: [
    keyframes`0%, 60%, 100% { transform: none; } 10%, 30%, 50% { transform: translateX(-2px) rotate(-3deg); } 20%, 40% { transform: translateX(2px) rotate(3deg); }`,
    "1.1s",
  ],
  Shocked: [keyframes`0%, 60%, 100% { transform: none; } 20% { transform: translateY(-6px) scale(1.12); } 40% { transform: scale(0.96); }`, "1.4s"],
  Melt: [keyframes`0%, 100% { transform: none; } 50% { transform: scale(1.12, 0.84); }`, "2s"],
  Party: [
    keyframes`0%, 100% { transform: none; } 25% { transform: translateY(-2px) rotate(-12deg); } 75% { transform: translateY(-2px) rotate(12deg); }`,
    "1s",
  ],
};

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
      PaperProps={{ sx: { my: 1, p: 1, borderRadius: 4, bgcolor: "rgba(20, 24, 40, 0.94)", boxShadow: "0 12px 32px rgba(0, 0, 0, 0.45)" } }}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 80px)", gap: 0.5 }}>
        {REACTIONS.map(({ emoji, name }, index) => {
          const [motion, duration] = MOTIONS[name];
          return (
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
              <Box
                component="span"
                aria-hidden
                sx={{
                  display: "block",
                  fontSize: 36,
                  lineHeight: 1,
                  // set off from each other, so the tray stirs rather than moving in step
                  animation: `${motion} ${duration} ease-in-out ${index * 0.17}s infinite`,
                  transformOrigin: "50% 80%",
                  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
                }}
              >
                {emoji}
              </Box>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "rgba(255, 255, 255, 0.75)", lineHeight: 1 }}>{name}</Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Popover>
  );
};

export default ReactionTray;
