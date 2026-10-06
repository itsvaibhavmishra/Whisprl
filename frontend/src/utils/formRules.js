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
