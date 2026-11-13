import { ActivityModel, AnnouncementModel, UserModel } from "#src/models/index.js";
import { sendFromWhisprlToEach } from "#src/services/whisprlMessageService.js";
import { reportError } from "#src/utils/errorReports.js";

const BATCH_SIZE = 500;
const RECIPIENTS = { verified: true, deletedAt: { $exists: false }, bannedAt: { $exists: false }, badge: { $ne: "official" } };
// a day noted before platforms were recorded was on the website, as the overview counts it
const PLATFORM_DAYS = { android: { platforms: "android" }, web: { $or: [{ platforms: "web" }, { "platforms.0": { $exists: false } }] } };

const recipientsOf = async (audience) => {
  if (audience === "everyone") return RECIPIENTS;
  return { ...RECIPIENTS, _id: { $in: await ActivityModel.distinct("user", PLATFORM_DAYS[audience]) } };
};

const noticeOf = ({ _id, text, button }) => ({ type: "announcement", announcement: _id, text, ...(button?.kind && { button }) });

// progress is saved after each batch, so a restart sends the unfinished batch again and a chat that has it already is skipped
const deliver = async (io, announcement) => {
  const notice = noticeOf(announcement);
  const recipients = await recipientsOf(announcement.audience);
  const batchAfter = (lastSentTo) =>
    UserModel.find({ $and: [recipients, lastSentTo ? { _id: { $gt: lastSentTo } } : {}] })
      .sort({ _id: 1 })
      .limit(BATCH_SIZE)
      .select("_id")
      .lean();
  for (let batch = await batchAfter(announcement.lastSentTo); batch.length; batch = await batchAfter(batch.at(-1)._id)) {
    const userIds = batch.map(({ _id }) => _id);
    const reached = await sendFromWhisprlToEach(io, userIds, notice, { isPushed: announcement.isPushed });
    await AnnouncementModel.updateOne({ _id: announcement._id }, { lastSentTo: batch.at(-1)._id, $inc: { reached } });
  }
  await AnnouncementModel.updateOne({ _id: announcement._id }, { finishedAt: new Date() });
};

const delivering = new Set();

// staff send announcements outside the app, so each sweep picks up any not finished, and one already going is left to finish
export const sendWaitingAnnouncements = async (io) => {
  const waiting = await AnnouncementModel.find({ finishedAt: { $exists: false } }).lean();
  for (const announcement of waiting.filter(({ _id }) => !delivering.has(String(_id)))) {
    delivering.add(String(announcement._id));
    deliver(io, announcement)
      .catch((error) => reportError(error))
      .finally(() => delivering.delete(String(announcement._id)));
  }
};
