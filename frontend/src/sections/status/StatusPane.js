import { Box, IconButton, Stack, Typography } from "@mui/material";
import { ArrowLeft } from "phosphor-react";

import WhisprlAvatar from "@/assets/icons/logo/WhisprlAvatar.webp";

export const PaneEmpty = ({ text, children }) => (
  <Stack alignItems="center" spacing={2} sx={{ px: 3, py: 8, textAlign: "center" }}>
    <Box component="img" src={WhisprlAvatar} alt="" sx={{ width: 96, height: 96, borderRadius: "50%", bgcolor: "chat.field" }} />
    <Typography sx={{ maxWidth: 300, fontSize: 14, fontWeight: 500, color: "text.secondary" }}>{text}</Typography>
    {children}
  </Stack>
);

// Discover and your updates share one column, inset and heading, so switching between them moves nothing
const StatusPane = ({ title, subtitle, onBack, action, children }) => (
  <Box sx={{ height: "100%", overflowY: "auto", bgcolor: { xs: "chat.list", md: "chat.canvas" } }}>
    <Box sx={{ maxWidth: 1040, mx: "auto", px: { xs: 2, md: 4 }, pt: { xs: 1.25, md: 4 }, pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minHeight: onBack || action ? 44 : "auto" }}>
          {onBack && (
            <IconButton aria-label="Back" onClick={onBack} sx={{ ml: -1 }}>
              <ArrowLeft size={22} />
            </IconButton>
          )}
          <Typography component="h2" sx={{ flex: 1, minWidth: 0, m: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>
            {title}
          </Typography>
          {action}
        </Stack>
        {subtitle && <Typography sx={{ mt: 0.75, pl: onBack ? 5 : 0, fontSize: 14, fontWeight: 500, color: "text.secondary" }}>{subtitle}</Typography>}
      </Box>
      {children}
    </Box>
  </Box>
);

export default StatusPane;
