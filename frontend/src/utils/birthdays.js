const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK = 7;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const isLeapYear = (year) => new Date(year, 1, 29).getMonth() === 1;

// someone born on 29 February celebrates on the 28th in a year without one
const birthdayIn = (year, { day, month }) => new Date(year, month - 1, month === 2 && day === 29 && !isLeapYear(year) ? 28 : day);

const nextBirthday = (birthday, today) => {
  const start = startOfDay(today);
  const thisYear = birthdayIn(start.getFullYear(), birthday);
  return thisYear >= start ? thisYear : birthdayIn(start.getFullYear() + 1, birthday);
};

export const daysUntilBirthday = (birthday, today = new Date()) => Math.round((nextBirthday(birthday, today) - startOfDay(today)) / DAY_MS);

export const isBirthdayToday = (birthday, today = new Date()) => Boolean(birthday) && daysUntilBirthday(birthday, today) === 0;

export const birthdayLabel = ({ day, month }) => new Date(2000, month - 1, day).toLocaleDateString(undefined, { day: "numeric", month: "long" });

export const whenLabel = (birthday, today = new Date()) => {
  const days = daysUntilBirthday(birthday, today);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return nextBirthday(birthday, today).toLocaleDateString(undefined, { weekday: "long" });
};

export const birthdaysThisWeek = (people, today = new Date()) =>
  people
    .filter((person) => person.birthday)
    .map((person) => ({ person, days: daysUntilBirthday(person.birthday, today) }))
    .filter(({ days }) => days < WEEK)
    .sort((one, other) => one.days - other.days || one.person.firstName.localeCompare(other.person.firstName))
    .map(({ person }) => person);

export const dateInputOf = (birthday) =>
  birthday ? `${birthday.year}-${String(birthday.month).padStart(2, "0")}-${String(birthday.day).padStart(2, "0")}` : "";
