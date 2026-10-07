import { Box, Stack, Typography } from "@mui/material";

export const DetailsSection = ({ title, action, children }) => (
  <Box component="section" sx={{ px: 1, pt: 2.5 }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1.5, pb: 0.75, minHeight: 32 }}>
      <Typography component="h3" sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary" }}>
        {title}
      </Typography>
      {action}
    </Stack>
    {children}
  </Box>
);
