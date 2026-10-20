import { Box, Skeleton, Stack } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { cornersOf, ownBubble } from "@/sections/chat/messages/MessageContainer";

// each bubble is its lines of text, in em so a placeholder never outgrows a real bubble on a narrow phone
const TURNS = [
  { isMine: true, bubbles: [[7]] },
  { isMine: false, bubbles: [[11], [6]] },
  { isMine: true, bubbles: [[13, 8]] },
  { isMine: false, bubbles: [[9], [13, 7]] },
  { isMine: true, bubbles: [[8]] },
  { isMine: false, bubbles: [[5.5]] },
  { isMine: true, bubbles: [[12], [14, 9]] },
  { isMine: false, bubbles: [[10]] },
];

const Bar = ({ width, isMine, height = 12 }) => (
  <Skeleton
    variant="rounded"
    animation="wave"
    sx={{
      width,
      maxWidth: "100%",
      height,
      borderRadius: 99,
      bgcolor: (theme) => (isMine ? alpha(theme.palette.common.white, 0.28) : alpha(theme.palette.text.primary, 0.12)),
      "@media (prefers-reduced-motion: reduce)": { "&::after": { animation: "none" } },
    }}
  />
);

const Bubble = ({ lines, isMine, isStart, isEnd }) => {
  const theme = useTheme();
  const surface = isMine ? ownBubble(theme) : { bgcolor: "chat.bubbleIn", boxShadow: `inset 0 0 0 1px ${theme.palette.chat.edge}, 0 1px 2px ${theme.palette.chat.shade}` };
  return (
    <Stack
      spacing={1}
      justifyContent="center"
      sx={{ ...surface, alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: { xs: "min(17em, 100%)", md: "min(28em, 100%)" }, minHeight: 38, px: 1.5, py: 1.5, borderRadius: cornersOf(isMine, isStart, isEnd) }}
    >
      {lines.map((width, position) =>
        position === lines.length - 1 ? (
          <Stack key={position} direction="row" alignItems="flex-end" spacing={1.5}>
            <Bar width={`${width}em`} isMine={isMine} />
            <Bar width="2.6em" height={8} isMine={isMine} />
          </Stack>
        ) : (
          <Bar key={position} width={`${width}em`} isMine={isMine} />
        )
      )}
    </Stack>
  );
};

const MessageSkeletons = () => (
  <Stack role="status" aria-label="Loading messages" sx={{ width: "100%", pb: 1 }}>
    <Skeleton variant="rounded" animation={false} sx={{ alignSelf: "center", width: 64, height: 24, my: 1, borderRadius: 99, bgcolor: "chat.pill" }} />
    {TURNS.map(({ isMine, bubbles }, turn) => (
      <Stack key={turn} spacing={0.5} sx={{ position: "relative", mt: turn ? { xs: 1.25, md: 1.5 } : 0 }}>
        {bubbles.map((lines, position) => (
          <Bubble key={position} lines={lines} isMine={isMine} isStart={position === 0} isEnd={position === bubbles.length - 1} />
        ))}
        {!isMine && (
          <Box sx={{ position: "absolute", bottom: 0, left: -36 }}>
            <Skeleton variant="circular" animation="wave" width={28} height={28} sx={{ bgcolor: (theme) => alpha(theme.palette.text.primary, 0.12) }} />
          </Box>
        )}
      </Stack>
    ))}
  </Stack>
);

export default MessageSkeletons;
