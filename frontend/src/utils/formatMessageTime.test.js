import { formatMessageTime } from "@/utils/formatMessageTime";

const now = new Date(2026, 9, 5, 18, 30);
const clockOf = (date) => date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

test("a message from today shows only its time", () => {
  const earlier = new Date(2026, 9, 5, 9, 5);
  expect(formatMessageTime(earlier, now)).toBe(clockOf(earlier));
});

test("a message from this week leads with the weekday", () => {
  const monday = new Date(2026, 9, 2, 9, 5);
  expect(formatMessageTime(monday, now)).toBe(`${monday.toLocaleDateString([], { weekday: "short" })} ${clockOf(monday)}`);
});

test("an older message shows its date, and its year only when it is not this one", () => {
  expect(formatMessageTime(new Date(2026, 0, 14, 9, 5), now)).not.toContain("2026");
  expect(formatMessageTime(new Date(2025, 0, 14, 9, 5), now)).toContain("2025");
});
