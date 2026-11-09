import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ActivityModel, AnnouncementModel, UserModel } from "#src/models/index.js";
import { AUDIENCES, MAX_ANNOUNCEMENT, MAX_BUTTON_LABEL } from "#src/models/announcementModel.js";
import { recordAction } from "#src/services/auditService.js";
import { sendFromWhisprl } from "#src/services/whisprlMessageService.js";
import { reportError } from "#src/utils/errorReports.js";

const PAGE_SIZE = 20;
const IN_APP_PATH = /^\/(?!\/)[\w\-/@.]*$/;
const RECIPIENTS = { verified: true, deletedAt: { $exists: false }, bannedAt: { $exists: false }, badge: { $ne: "official" } };
// a day noted before platforms were recorded was on the website, as the overview counts it
const PLATFORM_DAYS = { android: { platforms: "android" }, web: { $or: [{ platforms: "web" }, { "platforms.0": { $exists: false } }] } };

const recipientsOf = async (audience) => {
  if (audience === "everyone") return RECIPIENTS;
  return { ...RECIPIENTS, _id: { $in: await ActivityModel.distinct("user", PLATFORM_DAYS[audience]) } };
};

export const audienceSizes = async () => {
  const sizes = await Promise.all(AUDIENCES.map(async (audience) => UserModel.countDocuments(await recipientsOf(audience))));
  return Object.fromEntries(AUDIENCES.map((audience, index) => [audience, sizes[index]]));
};

const buttonFrom = (button) => {
  if (!button) return undefined;
  const label = String(button.label ?? "").trim();
  if (!label) throw createHttpError.BadRequest("Give the button a label");
  if (label.length > MAX_BUTTON_LABEL) throw createHttpError.BadRequest(`Keep the button label under ${MAX_BUTTON_LABEL} characters`);
  if (button.kind === "challenge") return { kind: "challenge", label };
  if (button.kind === "open" && IN_APP_PATH.test(button.to)) return { kind: "open", label, to: button.to };
  throw createHttpError.BadRequest("Choose where the button goes");
};

const noticeOf = ({ text, button }) => ({ type: "announcement", text, ...(button?.kind && { button }) });

// claimed before each person is sent it, so two servers carrying on together never send anyone the same announcement twice
const deliver = async (io, announcement) => {
  let lastSentTo = announcement.lastSentTo ?? null;
  const waiting = UserModel.find({ $and: [await recipientsOf(announcement.audience), lastSentTo ? { _id: { $gt: lastSentTo } } : {}] })
    .sort({ _id: 1 })
    .select("_id")
    .lean()
    .cursor();
  for await (const { _id } of waiting) {
    const claimed = await AnnouncementModel.updateOne({ _id: announcement._id, lastSentTo }, { lastSentTo: _id, $inc: { reached: 1 } });
    if (!claimed.modifiedCount) return;
    lastSentTo = _id;
    await sendFromWhisprl(io, _id, noticeOf(announcement), { isPushed: announcement.isPushed }).catch((error) => reportError(error, _id));
  }
  await AnnouncementModel.updateOne({ _id: announcement._id }, { finishedAt: new Date() });
};

const deliverInBackground = (io, announcement) => deliver(io, announcement).catch((error) => reportError(error));

export const announce = async (io, actor, { text, button, audience, isPushed }) => {
  const given = String(text ?? "").trim();
  if (!given) throw createHttpError.BadRequest("Write what Whisprl should say");
  if (given.length > MAX_ANNOUNCEMENT) throw createHttpError.BadRequest(`Keep it under ${MAX_ANNOUNCEMENT} characters`);
  if (!AUDIENCES.includes(audience)) throw createHttpError.BadRequest("Choose who it goes to");

  const announcement = await AnnouncementModel.create({
    author: actor._id,
    text: given,
    button: buttonFrom(button),
    audience,
    isPushed: Boolean(isPushed),
    audienceSize: await UserModel.countDocuments(await recipientsOf(audience)),
  });
  await recordAction({ actor: actor._id, action: "announced", reason: given });
  deliverInBackground(io, announcement.toObject());
  return announcement;
};

export const resumeAnnouncements = async (io) => {
  const unfinished = await AnnouncementModel.find({ finishedAt: { $exists: false } }).lean();
  unfinished.forEach((announcement) => deliverInBackground(io, announcement));
};

export const listAnnouncements = async (before) => {
  if (before && !mongoose.isValidObjectId(before)) throw createHttpError.BadRequest("That is not a place in the list");
  const announcements = await AnnouncementModel.find(before ? { _id: { $lt: before } } : {})
    .sort({ _id: -1 })
    .limit(PAGE_SIZE + 1)
    .populate("author", "firstName lastName avatar")
    .lean();
  return { announcements: announcements.slice(0, PAGE_SIZE), hasMore: announcements.length > PAGE_SIZE };
};
