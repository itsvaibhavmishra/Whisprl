import { Box, Stack, Typography } from "@mui/material";

import PlatformIcons from "@/sections/admin/PlatformIcons";

const SPLITS = [
  { key: "web", label: "Website only", platforms: ["web"] },
  { key: "android", label: "Android app only", platforms: ["android"] },
  { key: "both", label: "Both", platforms: ["web", "android"] },
];

const PlatformSplit = ({ counts }) => (
  <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
    {SPLITS.map(({ key, label, platforms }) => (
      <Stack key={key} spacing={1} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, border: 1, borderColor: "divider", minWidth: 0 }}>
        <PlatformIcons platforms={platforms} size={20} />
        <Typography component="dt" sx={{ order: 2, fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
          {label}
        </Typography>
        <Typography component="dd" sx={{ order: 1, m: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
          {counts[key].toLocaleString()}
        </Typography>
      </Stack>
    ))}
  </Box>
);

export default PlatformSplit;
