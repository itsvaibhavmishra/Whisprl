import createHttpError from "http-errors";

const isText = (...values) => values.every((value) => typeof value === "string");

export const assertText = (...values) => {
  if (!isText(...values)) throw createHttpError.BadRequest("Send text, not a list or an object");
};

export const trimmed = (value) => (typeof value === "string" ? value.trim() : value);

export const NAME_LIMIT = 30;
// letters of any language, with the spaces, hyphens, apostrophes and full stops names carry
const NAME = /^\p{L}[\p{L}\p{M} '.-]*$/u;

export const nameFrom = (value) => {
  assertText(value);
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > NAME_LIMIT) throw createHttpError.BadRequest(`Your name must be 2 to ${NAME_LIMIT} characters long`);
  if (!NAME.test(name)) throw createHttpError.BadRequest("Your name can only have letters, spaces, hyphens and apostrophes");
  return name;
};

export const firstWordOf = (name) => String(name ?? "").split(" ")[0];

export const normalizeEmail = (email) =>
  String(email ?? "")
    .trim()
    .toLowerCase();

const MIN_AGE = 13;
const ADULT_AGE = 18;
const EARLIEST_YEAR = 1900;
const BIRTHDAY_CHANGE_INTERVAL_MS = 365 * 24 * 60 * 60 * 1000;

const ageOn = (today, { day, month, year }) => {
  const hasHadBirthday = today.getUTCMonth() + 1 > month || (today.getUTCMonth() + 1 === month && today.getUTCDate() >= day);
  return today.getUTCFullYear() - year - (hasHadBirthday ? 0 : 1);
};

// a birthday comes as YYYY-MM-DD, and an empty one means none was given, the same rule at sign up and on the profile
export const birthdayFrom = (value) => {
  if (value === undefined || value === "") return null;
  assertText(value);
  const [year, month, day] = (/^(\d{4})-(\d{2})-(\d{2})$/.exec(value) ?? []).slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (!year || date.getUTCDate() !== day || date.getUTCMonth() !== month - 1 || year < EARLIEST_YEAR) {
    throw createHttpError.BadRequest("That date doesn't exist");
  }
  if (date > new Date()) throw createHttpError.BadRequest("A birthday can't be in the future");
  return { day, month, year };
};

export const isOldEnough = (birthday) => ageOn(new Date(), birthday) >= MIN_AGE;

export const oldEnoughBirthdayFrom = (value) => {
  const birthday = birthdayFrom(value);
  if (birthday && !isOldEnough(birthday)) throw createHttpError.BadRequest(`You must be at least ${MIN_AGE} to use Whisprl`);
  return birthday;
};

// under-18s and adults never meet strangers from the other band, so this is the one place the line is drawn
export const bandOf = (birthday, today = new Date()) => (ageOn(today, birthday) >= ADULT_AGE ? "adult" : "minor");

export const isSameDay = (one, other) => one.day === other.day && one.month === other.month && one.year === other.year;

// the birthday given at sign up never started the clock, so the first change is always free
export const assertBirthdayChange = ({ birthday, birthdayChangedAt }, wanted, now = new Date()) => {
  if (now - (birthdayChangedAt ?? 0) < BIRTHDAY_CHANGE_INTERVAL_MS) {
    throw createHttpError.TooManyRequests("A birthday can be changed once a year");
  }
  if (bandOf(birthday, now) !== bandOf(wanted, now)) {
    throw createHttpError.Forbidden("This change would move you between under 18 and adult, so only Whisprl support can make it");
  }
};

export const GENDERS = ["male", "female", "undisclosed"];

export const genderFrom = (value) => {
  if (!GENDERS.includes(value)) throw createHttpError.BadRequest("Choose male, female or prefer not to say");
  return value;
};

const USERNAME = /^(?=.{3,20}$)[a-z0-9]+(?:[._][a-z0-9]+)*$/;
const RESERVED_USERNAMES = new Set(["admin", "administrator", "help", "moderator", "official", "root", "support", "system", "whisprl"]);

export const normalizeUsername = (value) =>
  String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

export const usernameProblemOf = (username) => {
  if (!USERNAME.test(username)) {
    return "Use 3 to 20 letters, numbers, dots or underscores, with a letter or number at each end and no two dots or underscores together";
  }
  return RESERVED_USERNAMES.has(username) ? "That username is reserved" : null;
};
