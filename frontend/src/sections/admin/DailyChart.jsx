import { Box, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const dayLabelOf = (day) => dayjs(day).format("D MMM");

const DayTooltip = ({ active, payload, unit }) => {
  if (!active || !payload?.length) return null;
  const { day } = payload[0].payload;
  return (
    <Paper elevation={6} sx={{ px: 1.5, py: 1, borderRadius: 2 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>{dayLabelOf(day)}</Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{`${payload[0].value.toLocaleString()} ${unit}`}</Typography>
    </Paper>
  );
};

const DailyChart = ({ title, total, totalLabel, emptyLabel, data, dataKey, unit, isBars }) => {
  const theme = useTheme();
  const color = theme.palette.primary.main;
  const tick = { fontSize: 12, fill: theme.palette.text.secondary };
  const Chart = isBars ? BarChart : AreaChart;
  const isEmpty = data.every((point) => point[dataKey] === 0);

  return (
    <Box component="section" sx={{ minWidth: 0 }}>
      <Typography component="h3" sx={{ m: 0, fontSize: 16, fontWeight: 800 }}>
        {title}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", mt: 0.5 }}>
        <Typography sx={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{total.toLocaleString()}</Typography>
        <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>{totalLabel}</Typography>
      </Stack>
      <Box sx={{ mt: 2, height: 220, ml: -1 }}>
        {isEmpty ? (
          <Box sx={{ height: "100%", ml: 1, display: "grid", placeItems: "center", borderRadius: 2, border: 1, borderStyle: "dashed", borderColor: "divider" }}>
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{emptyLabel}</Typography>
          </Box>
        ) : (
          <ResponsiveContainer>
            <Chart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              {!isBars && (
                <defs>
                  <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
              )}
              <CartesianGrid vertical={false} stroke={theme.palette.divider} />
              <XAxis dataKey="day" tickFormatter={dayLabelOf} tick={tick} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<DayTooltip unit={unit} />} cursor={{ fill: theme.palette.action.hover, stroke: theme.palette.divider }} />
              {isBars ? (
                <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} />
              ) : (
                <Area dataKey={dataKey} type="monotone" stroke={color} strokeWidth={2.5} fill={`url(#fill-${dataKey})`} />
              )}
            </Chart>
          </ResponsiveContainer>
        )}
      </Box>
    </Box>
  );
};

export default DailyChart;
