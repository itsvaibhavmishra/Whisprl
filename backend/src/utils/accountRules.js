import createHttpError from "http-errors";
import validator from "validator";

const isText = (...values) => values.every((value) => typeof value === "string");

export const assertText = (...values) => {
  if (!isText(...values)) throw createHttpError.BadRequest("Send text, not a list or an object");
};

export const assertValidName = (firstName, lastName) => {
  assertText(firstName, lastName);
  if (!validator.isLength(firstName, { min: 3, max: 16 }) || !validator.isLength(lastName, { min: 3, max: 16 })) {
    throw createHttpError.BadRequest("First and last name must each be 3 to 16 characters long");
  }
  if (!validator.isAlpha(firstName) || !validator.isAlpha(lastName)) {
    throw createHttpError.BadRequest("First and last name can only contain letters");
  }
};

export const assertStrongPassword = (password) => {
  if (!isText(password) || !validator.isStrongPassword(password)) {
    throw createHttpError.BadRequest(
      "Password must be at least 8 characters long, with a number, a lowercase letter, an uppercase letter and a symbol"
    );
  }
};

export const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

const MIN_AGE = 13;
const EARLIEST_YEAR = 1900;

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
  if (ageOn(new Date(), { day, month, year }) < MIN_AGE) throw createHttpError.BadRequest(`You must be at least ${MIN_AGE} to use Whisprl`);
  return { day, month, year };
};

const USERNAME = /^(?=.{3,20}$)[a-z0-9]+(?:[._][a-z0-9]+)*$/;
const RESERVED_USERNAMES = new Set(["admin", "administrator", "help", "moderator", "official", "root", "support", "system", "whisprl"]);

export const normalizeUsername = (value) => String(value ?? "").trim().replace(/^@/, "").toLowerCase();

export const usernameProblemOf = (username) => {
  if (!USERNAME.test(username)) {
    return "Use 3 to 20 letters, numbers, dots or underscores, with a letter or number at each end and no two dots or underscores together";
  }
  return RESERVED_USERNAMES.has(username) ? "That username is reserved" : null;
};
