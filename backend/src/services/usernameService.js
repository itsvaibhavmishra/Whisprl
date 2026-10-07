import crypto from "crypto";
import createHttpError from "http-errors";

import { UserModel } from "#src/models/index.js";
import { normalizeUsername, usernameProblemOf } from "#src/utils/accountRules.js";

const RENAME_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_BASE_LENGTH = 14;
const FALLBACK_BASE = "user";

const plainPart = (name) =>
  String(name ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const baseFor = (firstName, lastName) => {
  const base = [plainPart(firstName), plainPart(lastName)].filter(Boolean).join(".").slice(0, MAX_BASE_LENGTH).replace(/\.$/, "");
  return usernameProblemOf(base) ? FALLBACK_BASE : base;
};

const isTaken = (username) => UserModel.exists({ username });

// a taken name gets up to six digits, which keeps it within the twenty character limit
export const availableUsername = async (firstName, lastName) => {
  const base = baseFor(firstName, lastName);
  if (base !== FALLBACK_BASE && !(await isTaken(base))) return base;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = `${base}${crypto.randomInt(10, 1000000)}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw createHttpError.ServiceUnavailable("Could not find a free username, please try again");
};

// accounts made before usernames existed are given one when the server starts
export const giveEveryoneAUsername = async () => {
  const missing = await UserModel.find({ username: { $exists: false } }).select("firstName lastName");
  for (const user of missing) {
    const username = await availableUsername(user.firstName, user.lastName);
    // a name taken in the meantime is left for the next start to settle
    await UserModel.updateOne({ _id: user._id, username: { $exists: false } }, { username }).catch((error) => {
      if (error.code !== 11000) throw error;
    });
  }
  return missing.length;
};

export const checkUsername = async (user, wanted) => {
  const username = normalizeUsername(wanted);
  const problem = usernameProblemOf(username);
  if (problem || username === user.username) return { username, problem };
  return { username, problem: (await isTaken(username)) ? "That username is taken" : null };
};

// the username given at sign up never started the clock, so the first change is always free
export const changeUsername = async (user, wanted) => {
  const { username, problem } = await checkUsername(user, wanted);
  if (problem) throw createHttpError.BadRequest(problem);
  if (username === user.username) return user;

  const changedAt = user.usernameChangedAt?.getTime() ?? 0;
  if (Date.now() - changedAt < RENAME_INTERVAL_MS) {
    throw createHttpError.TooManyRequests("A username can be changed once every 30 days");
  }

  user.set({ username, usernameChangedAt: new Date() });
  try {
    await user.save();
  } catch (error) {
    if (error.code === 11000) throw createHttpError.Conflict("That username is taken");
    throw error;
  }
  return user;
};
