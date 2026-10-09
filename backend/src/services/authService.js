import crypto from "crypto";
import createHttpError from "http-errors";
import validator from "validator";

import { UserModel } from "#src/models/index.js";
import { isDisposableEmail } from "#src/utils/checkDispose.js";
import { assertStrongPassword, assertValidName, normalizeEmail, normalizeUsername, oldEnoughBirthdayFrom } from "#src/utils/accountRules.js";
import { sha256 } from "#src/utils/sha256.js";
import { randomCoverStyle } from "#src/utils/coverStyles.js";
import otpMail from "#src/templates/mail/otp.js";
import resetMail from "#src/templates/mail/reset.js";
import { formatRemainingTime, transporter } from "#src/services/mailer.js";
import { endAllSessions, isSessionActive, sessionEnded, verifyAccessToken } from "#src/services/sessionService.js";
import { onboardingOf } from "#src/services/onboardingService.js";
import { availableUsername } from "#src/services/usernameService.js";

const CODE_LIFETIME = 10 * 60 * 1000;
const RESET_LIFETIME = 10 * 60 * 1000;
const RESEND_COOLDOWN = 90 * 1000;
const MAX_CODE_ATTEMPTS = 5;

export const toSessionUser = async (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  avatar: user.avatar,
  email: user.email,
  username: user.username,
  usernameChangedAt: user.usernameChangedAt,
  activityStatus: user.activityStatus,
  onlineStatus: user.onlineStatus,
  quickReactions: user.quickReactions,
  birthday: user.birthday ?? null,
  showBirthdayToFriends: user.showBirthdayToFriends,
  suggestToFriendsOfFriends: user.suggestToFriendsOfFriends,
  blocked: user.blocked,
  onboarding: await onboardingOf(user),
  whatsNewSeen: user.whatsNewSeen ?? null,
  createdAt: user.createdAt,
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
  if (!user) throw sessionEnded();
  return user;
};

// the session is looked up on every request, so logging a device out takes effect at once rather than when its token runs out
export const authenticate = async (token) => {
  const { sub, sid } = verifyAccessToken(token);
  const [user, isActive] = await Promise.all([findSessionUser(sub), isSessionActive(sid)]);
  if (!isActive) throw sessionEnded();

  return { user, sessionId: sid };
};

// -------------------------- Log in and sign up --------------------------
// a username never holds an @, and only verified accounts log in by one, so an account still verifying goes by its email
const accountFilterOf = (identifier) => {
  const value = String(identifier).trim();
  return value.indexOf("@") > 0 ? { email: normalizeEmail(value) } : { username: normalizeUsername(value), verified: true };
};

export const loginWithPassword = async (identifier, password) => {
  if (!identifier || !password) throw createHttpError.BadRequest("Required fields: email or username & password");

  const user = await UserModel.findOne(accountFilterOf(identifier)).select("+password");
  if (!user || !(await user.correctPassword(String(password)))) {
    throw createHttpError.Unauthorized("Incorrect email, username or password");
  }

  return user;
};

export const registerUser = async ({ firstName, lastName, email, password, birthday }) => {
  if (!firstName || !lastName || !email || !password || !birthday) {
    throw createHttpError.BadRequest("Required fields: firstName, lastName, email, password & birthday");
  }

  const address = normalizeEmail(email);
  assertValidName(firstName, lastName);
  if (!validator.isEmail(address)) throw createHttpError.BadRequest("Invalid email");
  assertStrongPassword(password);
  const born = oldEnoughBirthdayFrom(birthday);
  if (await isDisposableEmail(address)) throw createHttpError.BadRequest("Disposable emails are not allowed");

  const existing = await UserModel.findOne({ email: address }).select("+verification");
  if (existing?.verified) throw createHttpError.Conflict("Email is already registered");
  // checked before anything is saved, or a refused request would still replace the details a sent code verifies
  assertCooledDown(existing?.verification?.sentAt, "code");

  const user = existing ?? new UserModel({ email: address });
  user.set({ firstName, lastName, password, birthday: born, isNewAccount: true });
  user.username ??= await availableUsername(firstName, lastName);
  user.coverStyle ??= randomCoverStyle();
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
