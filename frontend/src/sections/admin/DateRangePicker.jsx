import { useState } from "react";
import { Box, ButtonBase, IconButton, Popover, Stack, Typography, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowRightIcon, CalendarBlankIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import dayjs from "dayjs";

import MonthGrid from "@/sections/admin/MonthGrid";
import { keyOf, todayKey } from "@/sections/admin/dayRanges";

const MAX_DAYS = 366;

const labelOf = (key) => dayjs(key).format("D MMM YYYY");

const spanOf = (one, other) => Math.abs(dayjs(one).diff(dayjs(other), "day")) + 1;

const ordered = (one, other) => (one <= other ? { from: one, to: other } : { from: other, to: one });

const DateRangePicker = ({ value, isCustom, onChange }) => {
  const isNarrow = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const [anchor, setAnchor] = useState(null);
  const [firstMonth, setFirstMonth] = useState(null);
  const [start, setStart] = useState(null);
  const [hovered, setHovered] = useState(null);
  const today = todayKey();

  const open = (event) => {
    const lastShown = dayjs(value.to).startOf("month");
    setFirstMonth(isNarrow ? lastShown : lastShown.subtract(1, "month"));
    setAnchor(event.currentTarget);
  };

  const close = () => {
    setAnchor(null);
    setStart(null);
    setHovered(null);
  };

  const pick = (key) => {
    if (!start) return setStart(key);
    onChange(ordered(start, key));
    close();
  };

  const isDisabled = (key) => key > today || (start !== null && spanOf(start, key) > MAX_DAYS);

  // while the end is being chosen, the band follows the pointer from the start already picked
  const shown = start ? ordered(start, hovered ?? start) : value;
  const months = firstMonth ? [firstMonth, ...(isNarrow ? [] : [firstMonth.add(1, "month")])] : [];
  const isHighlighted = isCustom || Boolean(anchor);

  return (
    <>
      <ButtonBase
        onClick={open}
        aria-haspopup="dialog"
        aria-pressed={isCustom}
        aria-label={`Custom range, ${labelOf(value.from)} to ${labelOf(value.to)}`}
        sx={{
          gap: 1,
          px: 1.5,
          height: 36,
          width: { xs: "100%", sm: "auto" },
          borderRadius: 2,
          border: 1,
          fontSize: 13.5,
          fontWeight: 700,
          whiteSpace: "nowrap",
          borderColor: isHighlighted ? "primary.main" : "divider",
          color: isCustom ? "primary.main" : "text.secondary",
          bgcolor: isCustom ? (theme) => alpha(theme.palette.primary.main, 0.12) : "transparent",
          "&:hover": { borderColor: isHighlighted ? "primary.main" : "text.secondary" },
          "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main" },
        }}
      >
        <CalendarBlankIcon size={18} />
        <span>{labelOf(value.from)}</span>
        <ArrowRightIcon size={14} aria-hidden />
        <span>{labelOf(value.to)}</span>
      </ButtonBase>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { role: "dialog", "aria-label": "Choose the days shown", sx: { mt: 1, p: 2, borderRadius: 3 } } }}
      >
        <Stack direction="row" spacing={3}>
          {months.map((month, position) => (
            <Box key={keyOf(month)}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", height: 36, mb: 0.5 }}>
                <IconButton
                  size="small"
                  aria-label="Earlier month"
                  onClick={() => setFirstMonth(firstMonth.subtract(1, "month"))}
                  sx={{ visibility: position === 0 ? "visible" : "hidden" }}
                >
                  <CaretLeftIcon size={16} weight="bold" />
                </IconButton>
                <Typography sx={{ fontSize: 14.5, fontWeight: 800 }}>{month.format("MMMM YYYY")}</Typography>
                <IconButton
                  size="small"
                  aria-label="Later month"
                  onClick={() => setFirstMonth(firstMonth.add(1, "month"))}
                  disabled={keyOf(months.at(-1).endOf("month")) >= today}
                  sx={{ visibility: position === months.length - 1 ? "visible" : "hidden" }}
                >
                  <CaretRightIcon size={16} weight="bold" />
                </IconButton>
              </Stack>
              <MonthGrid month={month} from={shown.from} to={shown.to} today={today} isDisabled={isDisabled} onPick={pick} onHover={setHovered} />
            </Box>
          ))}
        </Stack>
        <Typography role="status" sx={{ mt: 1.5, fontSize: 12.5, color: "text.secondary" }}>
          {start ? `From ${labelOf(start)}. Now pick the last day.` : "Pick the first day."}
        </Typography>
      </Popover>
    </>
  );
};

export default DateRangePicker;
