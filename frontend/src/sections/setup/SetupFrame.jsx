import { Box, Stack } from "@mui/material";

import BrandPanel from "@/layouts/auth/BrandPanel";

// the same frame as signing in, with nothing to leave by, since setup is the way into the app
const SetupFrame = ({ children }) => (
  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 5fr) minmax(0, 7fr)" }, minHeight: "100dvh" }}>
    <BrandPanel />
    <Stack sx={{ px: { xs: 2.5, sm: 4 }, pt: { xs: "calc(24px + env(safe-area-inset-top))", md: 6 }, pb: { xs: 3, md: 6 } }}>
      <Box component="main" sx={{ width: "100%", maxWidth: 420, mx: "auto", my: "auto", py: 4 }}>
        {children}
      </Box>
    </Stack>
  </Box>
);

export default SetupFrame;
