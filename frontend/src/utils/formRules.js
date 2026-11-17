import * as Yup from "yup";

export const nameRule = (label) =>
  Yup.string()
    .trim()
    .required(`${label} required`)
    .min(3, `${label} must be at least 3 characters long`)
    .max(16, `${label} cannot be more than 16 characters long`)
    .matches(/^[a-zA-Z]+$/, `${label} can only contain letters`);

const MIN_AGE = 13;
export const EARLIEST_BIRTHDAY = "1900-01-01";

const inputOf = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const isRealDate = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= EARLIEST_BIRTHDAY && date.getMonth() === month - 1 && date.getDate() === day;
};

export const isOldEnough = (value) => {
  const today = new Date();
  return value <= inputOf(new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate()));
};

// the server's rules, so a birthday the form accepts is never refused
const birthdayRule = Yup.string()
  .test("real", "That date doesn't exist", (value) => !value || isRealDate(value))
  .test("past", "A birthday can't be in the future", (value) => !value || value <= inputOf(new Date()));

// no age rule here: sign up checks the age only once submitted, so the form never hints at the age that gets in
export const signUpBirthdayRule = birthdayRule.required("Birthday required");

export const profileBirthdayRule = birthdayRule
  .test("old-enough", `You must be at least ${MIN_AGE} to use Whisprl`, (value) => !value || isOldEnough(value))
  .when("$hasBirthday", { is: true, then: (rule) => rule.required("Your birthday can be changed, not removed") });

export const genderRule = Yup.string().required("Choose one, or prefer not to say");

export const BIO_LIMIT = 50;

export const bioRule = Yup.string().trim().max(BIO_LIMIT, `Keep your bio under ${BIO_LIMIT} characters`);
