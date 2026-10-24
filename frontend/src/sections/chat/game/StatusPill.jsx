import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

// the one line that says what the table is waiting for, loud while a game runs and quiet between them
const StatusPill = ({ theme, isLive = false, isWide = false, icon = null, children }) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="center"
    spacing={1}
    sx={{
      alignSelf: isWide ? "stretch" : "center",
      flexShrink: 0,
      maxWidth: "100%",
      px: 2,
      py: isWide ? 0.7 : 0.85,
      borderRadius: 99,
      ...(isLive
        ? { bgcolor: theme.accent, color: "#fff", boxShadow: `0 5px 16px ${alpha(theme.accent, 0.45)}` }
        : {
            bgcolor: theme.card,
            color: theme.ink,
            boxShadow: "0 4px 14px rgba(70, 48, 110, 0.16)",
            ...(theme.outline && { border: `1px solid ${alpha(theme.outline, 0.35)}` }),
          }),
    }}
  >
    {icon ?? <Box sx={{ width: 13, height: 13, borderRadius: "50%", flexShrink: 0, bgcolor: isLive ? "#fff" : alpha(theme.ink, 0.45) }} />}
    <Typography noWrap sx={{ fontSize: 13, fontWeight: 800 }}>
      {children}
    </Typography>
  </Stack>
);

export default StatusPill;
