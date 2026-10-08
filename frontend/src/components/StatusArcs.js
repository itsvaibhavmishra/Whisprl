import { Box, useTheme } from "@mui/material";

const GAP_DEGREES = 8;

// colour alone tells seen from unseen too faintly, so a seen arc is also half as thick
const StatusArcs = ({ statuses, size, stroke, sx }) => {
  const theme = useTheme();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const count = statuses.length;
  // fixed gaps would swallow the arcs of someone with dozens of statuses
  const gapDegrees = Math.min(GAP_DEGREES, 180 / count);
  const gap = count > 1 ? (gapDegrees / 360) * circumference : 0;
  const arc = circumference / count - gap;

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      sx={{
        position: "absolute",
        width: size,
        height: size,
        transform: "rotate(-90deg)",
        pointerEvents: "none",
        "& circle": { transition: "stroke 240ms ease" },
        "@media (prefers-reduced-motion: reduce)": { "& circle": { transition: "none" } },
        ...sx,
      }}
    >
      {statuses.map((status, index) => (
        <circle
          key={status._id}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={status.isViewed === false ? stroke : stroke / 2}
          strokeLinecap={count > 1 ? "round" : "butt"}
          stroke={status.isViewed === false ? theme.palette.primary.main : theme.palette.text.disabled}
          strokeDasharray={`${arc} ${circumference - arc}`}
          strokeDashoffset={-index * (arc + gap)}
        />
      ))}
    </Box>
  );
};

export default StatusArcs;
