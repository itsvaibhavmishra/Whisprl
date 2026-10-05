const WEEK_AGO = 6 * 24 * 60 * 60 * 1000;

export const formatMessageTime = (time, now = new Date()) => {
  const date = new Date(time);
  const clock = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (date.toDateString() === now.toDateString()) return clock;
  if (now - date < WEEK_AGO) return `${date.toLocaleDateString([], { weekday: "short" })} ${clock}`;

  const isThisYear = date.getFullYear() === now.getFullYear();
  const day = date.toLocaleDateString([], { month: "short", day: "numeric", ...(!isThisYear && { year: "numeric" }) });
  return `${day}, ${clock}`;
};
