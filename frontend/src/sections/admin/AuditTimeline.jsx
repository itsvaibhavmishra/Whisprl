import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import AuditEntry, { NODE_SIZE } from "@/sections/admin/AuditEntry";
import { formatDayLabel } from "@/utils/formatMessageTime";

// entries arrive newest first, so each day's entries already sit together
const byDay = (entries) =>
  entries.reduce((days, entry) => {
    const day = formatDayLabel(entry.createdAt);
    if (days.at(-1)?.day === day) days.at(-1).entries.push(entry);
    else days.push({ day, entries: [entry] });
    return days;
  }, []);

const AuditTimeline = ({ entries }) => (
  <Box component="ol" sx={{ m: 0, p: 0, listStyle: "none" }}>
    {byDay(entries).map(({ day, entries: ofDay }) => (
      <Box component="li" key={day} sx={{ mt: 3 }}>
        <Typography
          component="h2"
          sx={{
            display: "inline-block",
            m: 0,
            px: 1.5,
            py: 0.5,
            borderRadius: 99,
            fontSize: 12,
            fontWeight: 700,
            color: "text.secondary",
            bgcolor: (theme) => alpha(theme.palette.text.primary, 0.07),
          }}
        >
          {day}
        </Typography>
        <Box
          component="ol"
          sx={{
            position: "relative",
            m: 0,
            mt: 1,
            p: 0,
            listStyle: "none",
            "&::before": { content: '""', position: "absolute", top: 0, bottom: 0, left: NODE_SIZE / 2 - 1, width: 2, bgcolor: "divider" },
          }}
        >
          {ofDay.map((entry) => (
            <AuditEntry key={entry._id} entry={entry} />
          ))}
        </Box>
      </Box>
    ))}
  </Box>
);

export default AuditTimeline;
