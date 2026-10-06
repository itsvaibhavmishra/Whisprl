const WEEK_AGO = 6 * 24 * 60 * 60 * 1000;

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
