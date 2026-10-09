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

export const PaneSection = ({ label, count, children }) => (
  <Box component="section" aria-label={label}>
    <Typography component="h3" sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary" }}>
      {label}
      {count > 0 && (
        <Box component="span" sx={{ ml: 0.75, fontWeight: 500 }}>
          {count}
        </Box>
      )}
    </Typography>
    {children}
  </Box>
);

// a column narrow enough to read across, for panes that hold a list or a profile rather than a grid
export const READING_WIDTH = 760;

export const PANE_INSET = { px: { xs: 2, md: 4 }, pt: { xs: 1.5, md: 4 } };

export const LIST_WIDTH = { md: 340, lg: 380 };

// every pane beside a list shares one column, inset and heading, so switching between them moves nothing
const Pane = ({ title, subtitle, onBack, action, width = 1040, children }) => (
  <Box sx={{ height: "100%", overflowY: "auto", bgcolor: { xs: "chat.list", md: "chat.canvas" } }}>
    <Box sx={{ maxWidth: width, mx: "auto", ...PANE_INSET, pb: 6 }}>
      <Box
        sx={{
          mb: 4,
          display: "grid",
          gridTemplateColumns: "auto minmax(0, 1fr) auto",
          gridTemplateRows: onBack || action ? "minmax(44px, auto)" : "auto",
          gridTemplateAreas: `"back title action" ". subtitle subtitle"`,
          alignItems: "center",
        }}
      >
        {onBack && (
          <IconButton aria-label="Back" onClick={onBack} sx={{ gridArea: "back", ml: -1, mr: 1 }}>
            <ArrowLeft size={22} />
          </IconButton>
        )}
        <Typography component="h2" sx={{ gridArea: "title", m: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>
          {title}
        </Typography>
        {action && <Box sx={{ gridArea: "action", ml: 1 }}>{action}</Box>}
        {subtitle && <Typography sx={{ gridArea: "subtitle", mt: 0.75, fontSize: 14, fontWeight: 500, color: "text.secondary" }}>{subtitle}</Typography>}
      </Box>
      {children}
    </Box>
  </Box>
);

export default Pane;
