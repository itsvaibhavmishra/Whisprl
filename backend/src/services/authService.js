import crypto from "crypto";
import createHttpError from "http-errors";

import { UserModel } from "#src/models/index.js";
import { normalizeEmail } from "#src/utils/accountRules.js";
import { sha256 } from "#src/utils/sha256.js";
import { formatRemainingTime, sendMail } from "#src/services/mailer.js";
import { isSessionActive, sessionEnded, verifyAccessToken } from "#src/services/sessionService.js";
import { onboardingOf } from "#src/services/onboardingService.js";
import { permissionsOf, roleOf } from "#src/services/roleService.js";
import { assertNotShutOut } from "#src/services/moderationService.js";
import { openAccount } from "#src/services/socialAuthService.js";

export const CODE_LIFETIME = 10 * 60 * 1000;
const RESEND_COOLDOWN = 90 * 1000;
export const MAX_CODE_ATTEMPTS = 5;

export const toSessionUser = async (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  avatar: user.avatar,
  tag: user.tag,
  badge: user.tag,
  email: user.email,
  username: user.username,
  usernameChangedAt: user.usernameChangedAt,
  activityStatus: user.activityStatus,
  onlineStatus: user.onlineStatus,
  quickReactions: user.quickReactions,
  gameAudio: Object.fromEntries(user.gameAudio ?? []),
  birthday: user.birthday ?? null,
  birthdayChangedAt: user.birthdayChangedAt ?? null,
  gender: user.gender ?? null,
  showBirthdayToFriends: user.showBirthdayToFriends,
  suggestToFriendsOfFriends: user.suggestToFriendsOfFriends,
  blocked: user.blocked,
  onboarding: onboardingOf(user),
  hasToured: Boolean(user.touredAt),
  createdAt: user.createdAt,
  role: roleOf(user),
  permissions: permissionsOf(user),
});

export const newCode = () => crypto.randomInt(0, 1000000).toString().padStart(6, "0");

export const matchesHash = (value, hash) => crypto.timingSafeEqual(Buffer.from(sha256(value)), Buffer.from(hash));

export const assertCooledDown = (sentAt, what) => {
  const waitMs = sentAt ? RESEND_COOLDOWN - (Date.now() - sentAt.getTime()) : 0;
  if (waitMs > 0) {
    throw createHttpError.TooManyRequests(`Please wait ${formatRemainingTime(Math.ceil(waitMs / 1000))} before requesting a new ${what}`);
  }
};

export const mailOrFail = async (to, subject, html) => {
  try {
    await sendMail(to, subject, html);
  } catch {
    throw createHttpError(502, "We could not send the email, please try again", { expose: true });
  }
};

export const findSessionUser = async (user_id) => {
  const user = await UserModel.findOne({ _id: user_id, verified: true });
  if (!user) throw sessionEnded();
  assertNotShutOut(user);
  return user;
};

// the session is looked up on every request, so logging a device out takes effect at once rather than when its token runs out
export const authenticate = async (token) => {
  const { sub, sid } = verifyAccessToken(token);
  const [user, isActive] = await Promise.all([findSessionUser(sub), isSessionActive(sid)]);
  if (!isActive) throw sessionEnded();

  return { user, sessionId: sid };
};

// Play's reviewers cannot sign in with a Google account of their own, so one account named in the environment signs in with a password
export const signInReviewer = async (email, password) => {
  const { REVIEW_ACCOUNT_EMAIL: reviewer, REVIEW_ACCOUNT_PASSWORD: secret } = process.env;
  const isReviewer = Boolean(reviewer && secret) && normalizeEmail(email) === normalizeEmail(reviewer) && matchesHash(String(password ?? ""), sha256(secret));
  if (!isReviewer) throw createHttpError.Unauthorized("Incorrect email or password");
  return openAccount({ email: reviewer, name: "Play Review" });
};
