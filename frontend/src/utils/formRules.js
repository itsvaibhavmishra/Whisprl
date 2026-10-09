import * as Yup from "yup";

export const nameRule = (label) =>
  Yup.string()
    .trim()
    .required(`${label} required`)
    .min(3, `${label} must be at least 3 characters long`)
    .max(16, `${label} cannot be more than 16 characters long`)
    .matches(/^[a-zA-Z]+$/, `${label} can only contain letters`);

// the symbols the server's strong password check accepts, so a rule shown as met is never refused
const SYMBOL = /[-#!$@£%^&*()_+|~=`{}[\]:";'<>?,./\\ ]/;

export const PASSWORD_RULES = [
  { label: "8 to 16 characters", isMet: (password) => password.length >= 8 && password.length <= 16 },
  { label: "A number", isMet: (password) => /[0-9]/.test(password) },
  { label: "A lowercase letter", isMet: (password) => /[a-z]/.test(password) },
  { label: "An uppercase letter", isMet: (password) => /[A-Z]/.test(password) },
  { label: "A symbol", isMet: (password) => SYMBOL.test(password) },
];

export const newPasswordRule = PASSWORD_RULES.reduce(
  (rule, { label, isMet }) => rule.test(label, `Password needs ${label.toLowerCase()}`, (password = "") => isMet(password)),
  Yup.string().required("Password required")
);

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

export const BIO_LIMIT = 50;

export const bioRule = Yup.string().trim().max(BIO_LIMIT, `Keep your bio under ${BIO_LIMIT} characters`);
