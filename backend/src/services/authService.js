import crypto from "crypto";
import createHttpError from "http-errors";
import validator from "validator";

import { UserModel } from "../models/index.js";
import { isDisposableEmail } from "../utils/checkDispose.js";
import { assertStrongPassword, assertValidName, normalizeEmail } from "../utils/accountRules.js";
import { sha256 } from "../utils/sha256.js";
import otpMail from "../templates/mail/otp.js";
import resetMail from "../templates/mail/reset.js";
import { formatRemainingTime, transporter } from "./mailer.js";
import { endAllSessions, verifyAccessToken } from "./sessionService.js";

const CODE_LIFETIME = 10 * 60 * 1000;
const RESET_LIFETIME = 10 * 60 * 1000;
const RESEND_COOLDOWN = 90 * 1000;
const MAX_CODE_ATTEMPTS = 5;

const SESSION_EXPIRED = "Your session expired, please log in again";

export const toSessionUser = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  avatar: user.avatar,
  email: user.email,
  activityStatus: user.activityStatus,
  onlineStatus: user.onlineStatus,
});

const matchesHash = (value, hash) => crypto.timingSafeEqual(Buffer.from(sha256(value)), Buffer.from(hash));

const assertCooledDown = (sentAt, what) => {
  const waitMs = sentAt ? RESEND_COOLDOWN - (Date.now() - sentAt.getTime()) : 0;
  if (waitMs > 0) {
    throw createHttpError.TooManyRequests(
      `Please wait ${formatRemainingTime(Math.ceil(waitMs / 1000))} before requesting a new ${what}`
    );
  }
};

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({ from: `Whisprl <${process.env.MAIL_USER}>`, to, subject, html });
  } catch {
    throw createHttpError(502, "We could not send the email, please try again", { expose: true });
  }
};

// -------------------------- Access tokens --------------------------
export const findSessionUser = async (user_id) => {
  const user = await UserModel.findOne({ _id: user_id, verified: true });
  if (!user) throw createHttpError.Unauthorized(SESSION_EXPIRED);
  return user;
};

export const authenticate = async (token) => {
  if (!token) throw createHttpError.Unauthorized("Please log in first");

  const { sub, sid, iat } = verifyAccessToken(token);
  const user = await findSessionUser(sub);
  if (user.changedPasswordAfter(iat)) throw createHttpError.Unauthorized(SESSION_EXPIRED);

  return { user, sessionId: sid };
};

// -------------------------- Log in and sign up --------------------------
export const loginWithPassword = async (email, password) => {
  if (!email || !password) throw createHttpError.BadRequest("Required fields: email & password");

  const user = await UserModel.findOne({ email: normalizeEmail(email) }).select("+password");
  if (!user || !(await user.correctPassword(String(password)))) {
    throw createHttpError.Unauthorized("Incorrect email or password");
  }

  return user;
};

export const registerUser = async ({ firstName, lastName, email, password }) => {
  if (!firstName || !lastName || !email || !password) {
    throw createHttpError.BadRequest("Required fields: firstName, lastName, email & password");
  }

  const address = normalizeEmail(email);
  assertValidName(firstName, lastName);
  if (!validator.isEmail(address)) throw createHttpError.BadRequest("Invalid email");
  assertStrongPassword(password);
  if (await isDisposableEmail(address)) throw createHttpError.BadRequest("Disposable emails are not allowed");

  const existing = await UserModel.findOne({ email: address }).select("+verification");
  if (existing?.verified) throw createHttpError.Conflict("Email is already registered");
  // checked before anything is saved, or a refused request would still replace the details a sent code verifies
  assertCooledDown(existing?.verification?.sentAt, "code");

  const user = existing ?? new UserModel({ email: address });
  user.set({ firstName, lastName, password });
  await user.save();

  return user;
};

// -------------------------- Email verification --------------------------
export const sendVerificationCode = async (user) => {
  assertCooledDown(user.verification?.sentAt, "code");

  const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
  const now = Date.now();
  user.verification = { codeHash: sha256(code), expiresAt: now + CODE_LIFETIME, sentAt: now, attempts: 0 };
  await user.save();

  try {
    await sendMail(user.email, "Whisprl - Here's your OTP", otpMail(validator.escape(user.firstName), code));
  } catch (error) {
    user.verification = undefined;
    await user.save();
    throw error;
  }
};

export const resendVerificationCode = async (email) => {
  const user = await UserModel.findOne({ email: normalizeEmail(email) }).select("+verification");

  if (!user) throw createHttpError.NotFound("No account uses that email, please sign up");
  if (user.verified) throw createHttpError.Conflict("Email is already verified, please log in");

  await sendVerificationCode(user);
};

const whyCodeWasRefused = async (email) => {
  const user = await UserModel.findOne({ email }).select("+verification");

  if (!user) return createHttpError.NotFound("No account uses that email, please sign up");
  if (user.verified) return createHttpError.Conflict("Email is already verified, please log in");
  if (!user.verification || user.verification.expiresAt <= Date.now()) {
    return createHttpError.BadRequest("That code expired, please request a new one");
  }
  return createHttpError.TooManyRequests("Too many attempts, please request a new code");
};

// counting the attempt in the same write that checks the limit, so parallel guesses cannot slip past it
export const verifyEmail = async (email, code) => {
  if (!email || !code) throw createHttpError.BadRequest("Required fields: email & otp");

  const address = normalizeEmail(email);
  const user = await UserModel.findOneAndUpdate(
    {
      email: address,
      verified: false,
      "verification.expiresAt": { $gt: new Date() },
      "verification.attempts": { $lt: MAX_CODE_ATTEMPTS },
    },
    { $inc: { "verification.attempts": 1 } },
    { new: true }
  ).select("+verification");

  if (!user) throw await whyCodeWasRefused(address);
  if (!matchesHash(code, user.verification.codeHash)) throw createHttpError.BadRequest("Incorrect code");

  user.verified = true;
  user.verification = undefined;
  await user.save();

  return user;
};

// -------------------------- Password reset --------------------------
export const sendPasswordReset = async (email) => {
  const user = await UserModel.findOne({ email: normalizeEmail(email) }).select("+passwordReset");
  if (!user) throw createHttpError.NotFound("Email is not registered");

  assertCooledDown(user.passwordReset?.sentAt, "reset link");

  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  user.passwordReset = { tokenHash: sha256(token), expiresAt: now + RESET_LIFETIME, sentAt: now };
  await user.save();

  const resetUrl = `${process.env.FRONT_URL}/auth/reset-password/?code=${token}`;
  try {
    await sendMail(user.email, "Whisprl - Here's your Password Reset Link", resetMail(validator.escape(user.firstName), resetUrl));
  } catch (error) {
    user.passwordReset = undefined;
    await user.save();
    throw error;
  }
};

export const resetPasswordWithToken = async ({ token, password, passwordConfirm }) => {
  if (!token) throw createHttpError.BadRequest("Required field: token");

  const user = await UserModel.findOne({
    "passwordReset.tokenHash": sha256(token),
    "passwordReset.expiresAt": { $gt: new Date() },
  }).select("+passwordReset");

  if (!user) throw createHttpError.BadRequest("That reset link expired, please request a new one");
  if (password !== passwordConfirm) throw createHttpError.BadRequest("Password and Confirm Password do not match");
  assertStrongPassword(password);

  user.password = password;
  user.passwordReset = undefined;
  await user.save();

  await endAllSessions(user._id);
  return user;
};
