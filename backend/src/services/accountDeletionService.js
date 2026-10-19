import createHttpError from "http-errors";
import validator from "validator";

import {
  ChatPreferenceModel,
  FriendRequestModel,
  PasskeyChallengeModel,
  PasskeyModel,
  RequestCooldownModel,
  StatusModel,
  UserModel,
} from "#src/models/index.js";
import { DELETION_REASONS } from "#src/models/userModel.js";
import { CODE_LIFETIME, MAX_CODE_ATTEMPTS, assertCooledDown, mailOrFail, matchesHash, newCode } from "#src/services/authService.js";
import { deleteFile, isCloudinaryFile } from "#src/services/fileUploadService.js";
import { announceGroupChange, leaveEveryGroup } from "#src/services/groupService.js";
import { sendMail } from "#src/services/mailer.js";
import { DELETED_ACCOUNT, endsOn } from "#src/services/moderationService.js";
import { isStaff } from "#src/services/roleService.js";
import { endAllSessions, signOutEverywhere } from "#src/services/sessionService.js";
import { sha256 } from "#src/utils/sha256.js";
import deletionCodeMail from "#src/templates/mail/deletionCode.js";
import deletionScheduledMail from "#src/templates/mail/deletionScheduled.js";

const DELETION_DELAY = 14 * 24 * 60 * 60 * 1000;
const MAX_NOTE_LENGTH = 500;
const SWEEP_BATCH = 20;

// everything that names the person or records their choices goes, and only what other people's chats need stays
const FORGOTTEN_FIELDS = [
  "password",
  "username",
  "usernameChangedAt",
  "usernameConfirmedAt",
  "birthday",
  "keyBackup",
  "recoveryKeySavedAt",
  "verification",
  "passwordReset",
  "deletionCode",
  "hiddenProfile",
  "socialsConnected",
  "quickReactions",
  "skippedSteps",
  "whatsNewSeen",
  "notificationsAllowedAt",
  "agePausedUntil",
];

const assertMayDelete = (user) => {
  if (isStaff(user)) throw createHttpError.Forbidden("A staff account can't be deleted. Give up your staff access first.");
};

const reasonFrom = ({ reason, note }) => {
  if (!DELETION_REASONS.includes(reason)) throw createHttpError.BadRequest("Choose why you are leaving");
  const written = typeof note === "string" ? note.trim() : "";
  if (written.length > MAX_NOTE_LENGTH) throw createHttpError.BadRequest(`Keep it under ${MAX_NOTE_LENGTH} characters`);
  if (reason === "other" && !written) throw createHttpError.BadRequest("Tell us why you are leaving");
  return { reason, ...(written && { note: written }) };
};

export const sendDeletionCode = async (user) => {
  assertMayDelete(user);
  const { deletionCode } = await UserModel.findById(user._id).select("+deletionCode").lean();
  assertCooledDown(deletionCode?.sentAt, "code");

  const code = newCode();
  const now = Date.now();
  await UserModel.updateOne({ _id: user._id }, { deletionCode: { codeHash: sha256(code), expiresAt: now + CODE_LIFETIME, sentAt: now, attempts: 0 } });

  try {
    await mailOrFail(user.email, `${code} is your code to delete your Whisprl account`, deletionCodeMail(validator.escape(user.firstName), code));
  } catch (error) {
    await UserModel.updateOne({ _id: user._id }, { $unset: { deletionCode: 1 } });
    throw error;
  }
};

const whyCodeWasRefused = async (user_id) => {
  const { deletionCode } = await UserModel.findById(user_id).select("+deletionCode").lean();
  if (!deletionCode || deletionCode.expiresAt <= Date.now()) return createHttpError.BadRequest("That code expired, please request a new one");
  return createHttpError.TooManyRequests("Too many attempts, please request a new code");
};

// counting the attempt in the same write that checks the limit, so parallel guesses cannot slip past it
const assertCodeMatches = async (user_id, code) => {
  if (!code) throw createHttpError.BadRequest("Enter the code we emailed you");
  const user = await UserModel.findOneAndUpdate(
    { _id: user_id, "deletionCode.expiresAt": { $gt: new Date() }, "deletionCode.attempts": { $lt: MAX_CODE_ATTEMPTS } },
    { $inc: { "deletionCode.attempts": 1 } },
    { new: true }
  ).select("+deletionCode");

  if (!user) throw await whyCodeWasRefused(user_id);
  if (!matchesHash(String(code), user.deletionCode.codeHash)) throw createHttpError.BadRequest("Incorrect code");
};

const tellScheduled = ({ email, firstName }, dueAt) =>
  sendMail(
    email,
    "Your Whisprl account will be deleted",
    deletionScheduledMail({ name: validator.escape(firstName), day: endsOn(dueAt), loginUrl: `${process.env.FRONT_URL}/auth/login` })
  ).catch((error) => console.error(`[deletion mail] ${error.message}`));

export const scheduleDeletion = async (io, user, body) => {
  assertMayDelete(user);
  const why = reasonFrom(body);
  await assertCodeMatches(user._id, body.code);

  const requestedAt = new Date();
  const dueAt = new Date(requestedAt.getTime() + DELETION_DELAY);
  await UserModel.updateOne({ _id: user._id }, { deletion: { requestedAt, dueAt, ...why }, $unset: { deletionCode: 1 } });
  await endAllSessions(user._id);
  signOutEverywhere(io, user._id);
  tellScheduled(user, dueAt);

  return { dueAt, day: endsOn(dueAt) };
};

// the account stays as a placeholder rather than vanishing, so the people it chatted with can still open what it sent them
const deleteAccount = async (io, user_id) => {
  const user = await UserModel.findOne({ _id: user_id, deletedAt: { $exists: false } });
  if (!user) return;

  await endAllSessions(user._id);
  signOutEverywhere(io, user._id);
  for (const change of await leaveEveryGroup(user._id)) announceGroupChange(io, change);

  const statuses = await StatusModel.find({ owner: user._id }).select("file").lean();
  const theirs = { $or: [{ sender: user._id }, { recipient: user._id }] };
  const listing = { $or: ["friends", "blocked", "statusHiddenFrom", "dismissedSuggestions"].map((field) => ({ [field]: user._id })) };
  await Promise.all([
    StatusModel.deleteMany({ owner: user._id }),
    PasskeyModel.deleteMany({ user: user._id }),
    PasskeyChallengeModel.deleteMany({ user: user._id }),
    ChatPreferenceModel.deleteMany({ user: user._id }),
    FriendRequestModel.deleteMany(theirs),
    RequestCooldownModel.deleteMany(theirs),
    UserModel.updateMany(
      { _id: { $ne: user._id }, ...listing },
      { $pull: { friends: user._id, blocked: user._id, statusHiddenFrom: user._id, dismissedSuggestions: user._id } }
    ),
  ]);

  await UserModel.updateOne(
    { _id: user._id },
    {
      ...DELETED_ACCOUNT,
      // the address is freed for a new account, and this one can never be logged into again
      email: `${user._id}@deleted.invalid`,
      verified: false,
      onlineStatus: "offline",
      friends: [],
      blocked: [],
      statusHiddenFrom: [],
      dismissedSuggestions: [],
      deletedAt: new Date(),
      $unset: Object.fromEntries(FORGOTTEN_FIELDS.map((field) => [field, 1])),
    }
  );

  const files = [user.avatar, user.cover, ...statuses.map((status) => status.file?.url)].filter(isCloudinaryFile);
  await Promise.allSettled(files.map(deleteFile));
};

// runs whenever the server is up, so an account due while it slept goes as soon as it wakes
export const deleteDueAccounts = async (io) => {
  const due = await UserModel.find({ "deletion.dueAt": { $lte: new Date() }, deletedAt: { $exists: false } }).select("_id").limit(SWEEP_BATCH).lean();
  for (const { _id } of due) await deleteAccount(io, _id);
  return due.length;
};

// logging in during the wait keeps the account, and one already past it goes now, even if the sweep has not reached it
export const settleDeletionAtLogin = async (io, user) => {
  if (!user.deletion || user.deletedAt) return null;
  if (user.deletion.dueAt <= new Date()) {
    await deleteAccount(io, user._id);
    throw createHttpError.Unauthorized("This account has been deleted");
  }

  await UserModel.updateOne({ _id: user._id }, { $unset: { deletion: 1 } });
  user.deletion = undefined;
  return "Welcome back. Your account will not be deleted.";
};
