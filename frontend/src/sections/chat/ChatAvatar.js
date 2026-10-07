import { Box } from "@mui/material";
import { keyframes } from "@mui/material/styles";

import StatusArcs from "@/components/StatusArcs";
import getAvatar from "@/utils/avatars";

const popIn = keyframes`
  from { transform: scale(0); }
  to { transform: scale(1); }
`;

const RING_GAP = 2;

// the dot's ring takes the panels' colour, so it reads as cut out of the avatar
const ChatAvatar = ({ src, name, size = 48, isOnline = false, statuses }) => {
  const lineWidth = size >= 40 ? 2.5 : 2;
  // the status ring sits outside the avatar's box, so it can appear without moving anything around it
  const ringReach = lineWidth + RING_GAP;

  return (
    <Box sx={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      {statuses?.length > 0 && (
        <StatusArcs statuses={statuses} size={size + 2 * ringReach} stroke={lineWidth} sx={{ top: -ringReach, left: -ringReach }} />
      )}
      {getAvatar(src, name, size)}
      {isOnline && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: Math.round(size * 0.24),
            height: Math.round(size * 0.24),
            borderRadius: "50%",
            bgcolor: "success.main",
            border: `${lineWidth}px solid`,
            borderColor: "chat.list",
            animation: `${popIn} 240ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          }}
        />
      )}
    </Box>
  );
};

export default ChatAvatar;
