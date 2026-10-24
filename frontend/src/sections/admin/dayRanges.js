import dayjs from "dayjs";

export const keyOf = (date) => date.format("YYYY-MM-DD");

// the overview counts in UTC days, so today is UTC's today, not the device's
export const todayKey = () => new Date().toISOString().slice(0, 10);

export const lastDays = (count) => ({ from: keyOf(dayjs(todayKey()).subtract(count - 1, "day")), to: todayKey() });

export const PRESETS = [
  { label: "7 days", rangeOf: () => lastDays(7) },
  { label: "30 days", rangeOf: () => lastDays(30) },
  { label: "90 days", rangeOf: () => lastDays(90) },
  { label: "This month", rangeOf: () => ({ from: keyOf(dayjs(todayKey()).startOf("month")), to: todayKey() }) },
];

export const presetOf = (range) =>
  PRESETS.find((preset) => {
    const { from, to } = preset.rangeOf();
    return from === range.from && to === range.to;
  });
