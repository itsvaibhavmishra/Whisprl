import { Box, useTheme } from "@mui/material";

import getAvatar from "@/utils/createAvatar";

const GAP_DEGREES = 8;
const STROKE = 2.5;

// one arc per status, coloured until it has been seen
const StatusRing = ({ person, statuses, size }) => {
  const theme = useTheme();
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const count = statuses.length;
  const gap = count > 1 ? (GAP_DEGREES / 360) * circumference : 0;
  const arc = circumference / count - gap;

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <Box component="svg" viewBox={`0 0 ${size} ${size}`} aria-hidden sx={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        {statuses.map((status, index) => (
          <circle
            key={status._id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap={count > 1 ? "round" : "butt"}
            stroke={status.isViewed === false ? theme.palette.primary.main : theme.palette.text.disabled}
            strokeDasharray={`${arc} ${circumference - arc}`}
            strokeDashoffset={-index * (arc + gap)}
          />
        ))}
      </Box>
      <Box sx={{ position: "absolute", inset: STROKE + 2, display: "grid", "& > *": { width: "100%", height: "100%" } }}>
        {getAvatar(person.avatar, person.firstName, theme, size - 2 * (STROKE + 2))}
      </Box>
    </Box>
  );
};

export default StatusRing;
