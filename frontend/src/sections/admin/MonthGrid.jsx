import { Box, ButtonBase, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { keyOf } from "@/sections/admin/dayRanges";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const CELL = 40;

const daysOf = (month) => Array.from({ length: month.daysInMonth() }, (_, index) => month.date(index + 1));

const ROUND = CELL / 2;

// the band rounds off at each end of a week row, and an end day only reaches towards a neighbour in the same row
const bandOf = (day, from, to) => {
  const key = keyOf(day);
  if (!from || !to || from === to || key < from || key > to) return {};
  const isRowStart = day.day() === 0 || day.date() === 1;
  const isRowEnd = day.day() === 6 || day.date() === day.daysInMonth();
  if (key === from) return isRowEnd ? {} : { background: "linear-gradient(to right, transparent 50%, var(--band) 50%)" };
  if (key === to) return isRowStart ? {} : { background: "linear-gradient(to right, var(--band) 50%, transparent 50%)" };
  const [left, right] = [isRowStart ? ROUND : 0, isRowEnd ? ROUND : 0];
  return { background: "var(--band)", borderRadius: `${left}px ${right}px ${right}px ${left}px` };
};

const MonthGrid = ({ month, from, to, today, isDisabled, onPick, onHover }) => (
  <Box sx={{ width: CELL * 7 }}>
    <Box sx={{ display: "grid", gridTemplateColumns: `repeat(7, ${CELL}px)` }} aria-hidden>
      {WEEKDAYS.map((weekday, position) => (
        <Typography key={position} sx={{ height: CELL, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600, color: "text.secondary" }}>
          {weekday}
        </Typography>
      ))}
    </Box>
    <Box
      role="group"
      aria-label={month.format("MMMM YYYY")}
      onMouseLeave={() => onHover(null)}
      sx={{ display: "grid", gridTemplateColumns: `repeat(7, ${CELL}px)`, "--band": (theme) => alpha(theme.palette.primary.main, 0.16) }}
    >
      {daysOf(month).map((day) => {
        const key = keyOf(day);
        const isEnd = key === from || key === to;
        return (
          <Box
            key={key}
            sx={{
              gridColumnStart: day.date() === 1 ? day.day() + 1 : undefined,
              height: CELL,
              display: "grid",
              placeItems: "center",
              ...bandOf(day, from, to),
            }}
          >
            <ButtonBase
              disabled={isDisabled(key)}
              onClick={() => onPick(key)}
              onMouseEnter={() => onHover(key)}
              onFocus={() => onHover(key)}
              aria-label={day.format("D MMMM YYYY")}
              aria-pressed={isEnd}
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                fontSize: 13.5,
                fontWeight: isEnd ? 800 : 500,
                color: isEnd ? "primary.contrastText" : "text.primary",
                bgcolor: isEnd ? "primary.main" : "transparent",
                boxShadow: (theme) => (key === today && !isEnd ? `inset 0 0 0 1px ${theme.palette.text.secondary}` : "none"),
                "&:hover": { bgcolor: isEnd ? "primary.main" : "action.hover" },
                "&.Mui-disabled": { color: "text.disabled" },
                "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main", outlineOffset: 1 },
              }}
            >
              {day.date()}
            </ButtonBase>
          </Box>
        );
      })}
    </Box>
  </Box>
);

export default MonthGrid;
