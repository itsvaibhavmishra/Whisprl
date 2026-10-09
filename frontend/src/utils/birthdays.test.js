import { birthdaysThisWeek, daysUntilBirthday, dateInputOf, isBirthdayToday, whenLabel } from "@/utils/birthdays";

const on = (year, month, day) => new Date(year, month - 1, day, 15, 30);

test("a birthday today is zero days away, and one just gone is nearly a year away", () => {
  expect(daysUntilBirthday({ day: 9, month: 10 }, on(2026, 10, 9))).toBe(0);
  expect(isBirthdayToday({ day: 9, month: 10 }, on(2026, 10, 9))).toBe(true);
  expect(daysUntilBirthday({ day: 8, month: 10 }, on(2026, 10, 9))).toBe(364);
});

test("the coming week wraps past the end of the year", () => {
  expect(daysUntilBirthday({ day: 2, month: 1 }, on(2026, 12, 30))).toBe(3);
});

test("29 February falls on the 28th in a year without one, and on the 29th in a year with one", () => {
  expect(isBirthdayToday({ day: 29, month: 2 }, on(2027, 2, 28))).toBe(true);
  expect(isBirthdayToday({ day: 29, month: 2 }, on(2028, 2, 28))).toBe(false);
  expect(isBirthdayToday({ day: 29, month: 2 }, on(2028, 2, 29))).toBe(true);
});

test("the next seven days come soonest first, and nobody without a birthday shows", () => {
  const people = [
    { firstName: "Cal", birthday: { day: 15, month: 10 } },
    { firstName: "Ari", birthday: { day: 9, month: 10 } },
    { firstName: "Bea", birthday: { day: 16, month: 10 } },
    { firstName: "Dot" },
    { firstName: "Eli", birthday: { day: 10, month: 10 } },
  ];
  expect(birthdaysThisWeek(people, on(2026, 10, 9)).map((person) => person.firstName)).toEqual(["Ari", "Eli", "Cal"]);
});

test("labels say today, tomorrow, then the weekday", () => {
  expect(whenLabel({ day: 9, month: 10 }, on(2026, 10, 9))).toBe("Today");
  expect(whenLabel({ day: 10, month: 10 }, on(2026, 10, 9))).toBe("Tomorrow");
  expect(whenLabel({ day: 13, month: 10 }, on(2026, 10, 9))).toBe(new Date(2026, 9, 13).toLocaleDateString(undefined, { weekday: "long" }));
});

test("a stored birthday fills a date input, and none leaves it empty", () => {
  expect(dateInputOf({ day: 4, month: 3, year: 1995 })).toBe("1995-03-04");
  expect(dateInputOf(undefined)).toBe("");
});
