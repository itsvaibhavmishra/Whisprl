import { Box, Skeleton, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";

const ROWS = [
  { name: 42, preview: 78 },
  { name: 30, preview: 64 },
  { name: 48, preview: 86 },
  { name: 36, preview: 58 },
  { name: 44, preview: 72 },
  { name: 28, preview: 82 },
  { name: 40, preview: 66 },
  { name: 34, preview: 76 },
];

const Bar = ({ width, height }) => (
  <Skeleton
    variant="rounded"
    animation="wave"
    sx={{
      width,
      height,
      borderRadius: 99,
      bgcolor: (theme) => alpha(theme.palette.text.primary, 0.1),
      "@media (prefers-reduced-motion: reduce)": { "&::after": { animation: "none" } },
    }}
  />
);

const ChatRowSkeletons = () => (
  <Stack component="ul" role="status" aria-label="Loading chats" sx={{ m: 0, p: 0 }}>
    {ROWS.map(({ name, preview }, row) => (
      <Stack key={row} component="li" direction="row" alignItems="center" spacing={1.5} sx={{ listStyle: "none", px: 1, py: 1 }}>
        <Skeleton variant="circular" animation="wave" width={50} height={50} sx={{ flexShrink: 0, bgcolor: (theme) => alpha(theme.palette.text.primary, 0.1) }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ height: 22 }}>
            <Bar width={`${name}%`} height={13} />
            <Bar width={34} height={9} />
          </Stack>
          <Stack justifyContent="center" sx={{ mt: 0.25, height: 21 }}>
            <Bar width={`${preview}%`} height={11} />
          </Stack>
        </Box>
      </Stack>
    ))}
  </Stack>
);

export default ChatRowSkeletons;
