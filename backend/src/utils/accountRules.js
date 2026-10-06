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
