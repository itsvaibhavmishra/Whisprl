import createHttpError from "http-errors";

import { HIDDEN_PROFILE_FIELDS } from "#src/models/userModel.js";

// what everyone else sees in place of a banned, hidden or deleted account
export const PLACEHOLDER_PROFILE = { firstName: "Whisprl user", lastName: "", avatar: "", cover: "", activityStatus: "" };

export const profileOf = (user) => Object.fromEntries(HIDDEN_PROFILE_FIELDS.map((field) => [field, user[field]]).filter(([, value]) => value !== undefined));

const isSuspended = (user) => Boolean(user.suspendedUntil) && user.suspendedUntil > new Date();

export const isShutOut = (user) => Boolean(user.bannedAt) || isSuspended(user);

export const endsOn = (until) => until.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// a banned or suspended account cannot hold a session, so this guards both signing in and every later request
export const assertNotShutOut = (user) => {
  if (user.bannedAt) throw createHttpError(403, "This account is banned. Email us if you think that is wrong.", { expose: true, code: "account_banned" });
  if (isSuspended(user)) {
    throw createHttpError(403, `This account is suspended until ${endsOn(user.suspendedUntil)}.`, { expose: true, code: "account_suspended" });
  }
};
