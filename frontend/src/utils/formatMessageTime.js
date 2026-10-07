const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_AGO = 6 * DAY_MS;

// the clock chosen in settings, rather than the one the browser's language prefers
export const clockOptions = (use24Hour) => ({ hour: use24Hour ? "2-digit" : "numeric", minute: "2-digit", hour12: !use24Hour });

export const formatClock = (time, use24Hour = false) => new Date(time).toLocaleTimeString([], clockOptions(use24Hour));

export const formatMessageTime = (time, { use24Hour = false, now = new Date() } = {}) => {
  const date = new Date(time);
  const clock = formatClock(date, use24Hour);

  if (date.toDateString() === now.toDateString()) return clock;
  if (now - date < WEEK_AGO) return `${date.toLocaleDateString([], { weekday: "short" })} ${clock}`;

  const isThisYear = date.getFullYear() === now.getFullYear();
  const day = date.toLocaleDateString([], { month: "short", day: "numeric", ...(!isThisYear && { year: "numeric" }) });
  return `${day}, ${clock}`;
};

export const formatDayLabel = (time, now = new Date()) => {
  const date = new Date(time);
  const daysAgo = Math.round((new Date(now.toDateString()) - new Date(date.toDateString())) / DAY_MS);
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", ...(date.getFullYear() !== now.getFullYear() && { year: "numeric" }) });
};
