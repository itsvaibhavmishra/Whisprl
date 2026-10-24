import { Box, Stack, Typography } from "@mui/material";

const Figure = ({ label, value }) => (
  <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
    <Typography component="dt" sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
      {label}
    </Typography>
    <Typography component="dd" sx={{ m: 0, mt: 0.5, fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
      {value.toLocaleString()}
    </Typography>
  </Box>
);

const Group = ({ title, figures }) => (
  <Box component="section">
    <Typography component="h2" sx={{ m: 0, pb: 1.25, fontSize: 14, fontWeight: 800, borderBottom: 1, borderColor: "divider" }}>
      {title}
    </Typography>
    <Box component="dl" sx={{ m: 0, mt: 2, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", columnGap: 2 }}>
      {figures.map(([label, value]) => (
        <Figure key={label} label={label} value={value} />
      ))}
    </Box>
  </Box>
);

const OverviewFigures = ({ totals, active }) => (
  <Stack direction={{ xs: "column", lg: "row" }} spacing={{ xs: 4, lg: 6 }} sx={{ mt: 4, "& > *": { flex: 1 } }}>
    <Group
      title="Everyone"
      figures={[
        ["People", totals.users],
        ["Chats", totals.conversations],
        ["Messages", totals.messages],
      ]}
    />
    <Group
      title="Active"
      figures={[
        ["Today", active.today],
        ["Last 7 days", active.week],
        ["Last 30 days", active.month],
      ]}
    />
  </Stack>
);

export default OverviewFigures;
