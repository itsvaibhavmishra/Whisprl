import createHttpError from "http-errors";
import mongoose from "mongoose";

import { UserModel } from "#src/models/index.js";
import { HIDDEN_PROFILE_FIELDS } from "#src/models/userModel.js";
import { assertReason, recordAction } from "#src/services/auditService.js";
import { sendMail } from "#src/services/mailer.js";
import { markReportActioned } from "#src/services/reportQueueService.js";
import { endAllSessions, signOutEverywhere } from "#src/services/sessionService.js";
import { can, isStaff, roleOf } from "#src/services/roleService.js";
import { escapeRegex } from "#src/utils/escapeRegex.js";
import accountNoticeMail from "#src/templates/mail/accountNotice.js";

const PAGE_SIZE = 30;
const SEARCHED_FIELDS = ["firstName", "lastName", "username", "email"];
const LISTED_FIELDS = "firstName lastName username email avatar role verified bannedAt suspendedUntil createdAt";
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

const NOTICES = {
  suspended: (until) => ({
    subject: "Your Whisprl account is suspended",
    heading: "Your account is suspended",
    body: `Your Whisprl account is suspended until ${endsOn(until)}, and you have been logged out everywhere. You can log in again once it ends.`,
  }),
  banned: () => ({
    subject: "Your Whisprl account is banned",
    heading: "Your account is banned",
    body: "Your Whisprl account is banned, and you have been logged out everywhere. You will not be able to log in again.",
  }),
  restored: () => ({
    subject: "Your Whisprl account is back",
    heading: "Your account is back",
    body: "Your Whisprl account is no longer suspended or banned, so you can log in again.",
  }),
};

// the action stands whether or not the email arrives, so a failed send is only logged
const tellPerson = ({ email, firstName }, { subject, heading, body }, reason) =>
  sendMail(email, subject, accountNoticeMail({ name: firstName, heading, body, reason })).catch(
    (error) => console.error(`[moderation mail] ${error.message}`)
  );

// staff answer to the owner rather than to each other, so nobody here can act on another staff account
const findTarget = async (actor, user_id) => {
  if (!mongoose.isValidObjectId(user_id)) throw createHttpError.NotFound("No such account");
  const target = await UserModel.findById(user_id).select("+hiddenProfile");
  if (!target) throw createHttpError.NotFound("No such account");
  if (isStaff(target)) throw createHttpError.Forbidden("Staff accounts cannot be suspended or banned");
  if (actor._id.equals(target._id)) throw createHttpError.BadRequest("You cannot do this to your own account");
  return target;
};

const shutOut = async (io, user_id) => {
  await endAllSessions(user_id);
  signOutEverywhere(io, user_id);
};

// staff see who an account really is, even once a ban has put a placeholder in its place
const asListed = ({ hiddenProfile, ...user }) => ({ ...user, ...hiddenProfile, role: roleOf(user) });

export const listPeople = async ({ search, filter, page = 0 }) => {
  const now = new Date();
  const filters = {
    all: {},
    banned: { bannedAt: { $exists: true } },
    suspended: { suspendedUntil: { $gt: now } },
    staff: { role: "admin" },
  };
  if (!(filter in filters)) throw createHttpError.BadRequest("Choose a filter that exists");

  // every word has to appear somewhere, so a full name finds someone whose first and last names are separate fields
  const words = (typeof search === "string" ? search : "").trim().split(/\s+/).filter(Boolean);
  const matching = words.length
    ? { $and: words.map((word) => ({ $or: SEARCHED_FIELDS.map((field) => ({ [field]: { $regex: escapeRegex(word), $options: "i" } })) })) }
    : {};
  const skip = Math.max(0, Number(page) || 0) * PAGE_SIZE;

  const [people, total] = await Promise.all([
    UserModel.find({ ...filters[filter], ...matching })
      .select(`${LISTED_FIELDS} +hiddenProfile`)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    UserModel.countDocuments({ ...filters[filter], ...matching }),
  ]);

  return { people: people.map(asListed), total, hasMore: skip + people.length < total };
};

const assertNotBanned = (target) => {
  if (target.bannedAt) throw createHttpError.BadRequest("That account is already banned");
};

export const suspendPerson = async (io, actor, user_id, { until, reason, reportId }) => {
  const given = assertReason(reason);
  const endsAt = new Date(until);
  if (Number.isNaN(endsAt.getTime()) || endsAt <= new Date()) throw createHttpError.BadRequest("Choose when the suspension ends");

  const target = await findTarget(actor, user_id);
  assertNotBanned(target);
  await UserModel.updateOne({ _id: target._id }, { suspendedUntil: endsAt });
  await shutOut(io, target._id);
  await recordAction({ actor: actor._id, action: "suspended", target: target._id, reason: given });
  await markReportActioned(actor, reportId);
  tellPerson(target, NOTICES.suspended(endsAt), given);
};

export const banPerson = async (io, actor, user_id, { reason, reportId }) => {
  const given = assertReason(reason);
  const target = await findTarget(actor, user_id);
  assertNotBanned(target);
  // an account already hidden, as one waiting to be deleted is, keeps the real profile it set aside
  const hiddenProfile = target.hiddenProfile ?? profileOf(target);

  await UserModel.updateOne(
    { _id: target._id },
    { ...PLACEHOLDER_PROFILE, hiddenProfile, bannedAt: new Date(), $unset: { suspendedUntil: 1, username: 1 } }
  );
  await shutOut(io, target._id);
  await recordAction({ actor: actor._id, action: "banned", target: target._id, reason: given });
  await markReportActioned(actor, reportId);
  tellPerson(target, NOTICES.banned(), given);
};

export const restorePerson = async (actor, user_id, { reason }) => {
  const given = assertReason(reason);
  const target = await findTarget(actor, user_id);
  if (!isShutOut(target)) throw createHttpError.BadRequest("That account is not banned or suspended");
  if (!can(actor, target.bannedAt ? "ban" : "suspend")) throw createHttpError.Forbidden("Your access does not include this");

  const { username, ...profile } = target.hiddenProfile?.toObject() ?? {};
  await UserModel.updateOne(
    { _id: target._id },
    { ...profile, ...(username && { username }), $unset: { bannedAt: 1, suspendedUntil: 1, hiddenProfile: 1, ...(username ? {} : { username: 1 }) } }
  );
  await recordAction({ actor: actor._id, action: "restored", target: target._id, reason: given });
  tellPerson({ email: target.email, firstName: profile.firstName ?? target.firstName }, NOTICES.restored(), given);
};
