import rateLimit from "express-rate-limit";
import createHttpError from "http-errors";

import { normalizeEmail } from "#src/utils/accountRules.js";

const MINUTE = 60 * 1000;

const byIp = (req) => req.ip;
const byIpAndEmail = (req) => `${req.ip}:${normalizeEmail(req.body.email)}`;
const byUser = (req) => String(req.user._id);

const tooManyRequests = (req, res, next) => {
  const minutesLeft = Math.max(1, Math.ceil((req.rateLimit.resetTime - Date.now()) / MINUTE));
  next(createHttpError.TooManyRequests(`Too many requests, try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}`));
};

// each call keeps its own counter, so every route gets a separate budget
const limit = (windowMinutes, max, keyGenerator, options = {}) =>
  rateLimit({
    windowMs: windowMinutes * MINUTE,
    limit: max,
    keyGenerator,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: tooManyRequests,
    ...options,
  });

// only failed attempts count, so someone who logs in and out often is never locked out
export const loginLimit = () => limit(15, 10, byIpAndEmail, { skipSuccessfulRequests: true });
export const signupLimit = () => limit(60, 10, byIp);
export const emailLimit = () => limit(60, 5, byIpAndEmail);
export const codeLimit = () => limit(15, 10, byIp);
// a tab refreshes about once per access token, so this leaves room for many people behind one address
export const sessionLimit = () => limit(15, 300, byIp);
export const socialLimit = () => limit(15, 20, byIp);

export const uploadLimit = () => limit(15, 60, byUser);
export const searchLimit = () => limit(1, 30, byUser);
export const writeLimit = () => limit(15, 150, byUser);
export const readLimit = () => limit(1, 120, byUser);
