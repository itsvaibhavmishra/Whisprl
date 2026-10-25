import createHttpError from "http-errors";
import mongoose from "mongoose";

import { ReportModel } from "#src/models/index.js";
import { MAX_REPORT_NOTE } from "#src/models/reportModel.js";
import { recordAction } from "#src/services/auditService.js";

const PAGE_SIZE = 20;
const EVIDENCE_KEPT_DAYS = 90;
const PERSON_FIELDS = "firstName lastName username avatar activityStatus bannedAt suspendedUntil";

const FILTERS = {
  open: { outcome: { $exists: false } },
  actioned: { outcome: "actioned" },
  dismissed: { outcome: "dismissed" },
};

// only an update meant for everyone is readable here, since the rest are sealed to the people they were for
const asSubject = (conversation, reportedStatus) => {
  if (reportedStatus) {
    return reportedStatus.isPublic
      ? { kind: "status", status: { content: reportedStatus.content, file: reportedStatus.file, createdAt: reportedStatus.createdAt } }
      : { kind: "status", status: null };
  }
  if (conversation) {
    return conversation.isGroup
      ? { kind: "group", group: { name: conversation.name, picture: conversation.picture, members: conversation.users?.length ?? 0 } }
      : { kind: "chat" };
  }
  return { kind: "person" };
};

const asListed = ({ conversation, reportedStatus, ...report }) => ({ ...report, subject: asSubject(conversation, reportedStatus) });

export const listReports = async ({ filter, page = 0 }) => {
  if (!(filter in FILTERS)) throw createHttpError.BadRequest("Choose a filter that exists");
  const skip = Math.max(0, Number(page) || 0) * PAGE_SIZE;

  const [reports, total] = await Promise.all([
    ReportModel.find(FILTERS[filter])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .populate("reporter", PERSON_FIELDS)
      .populate("reportedUser", PERSON_FIELDS)
      .populate("closedBy", PERSON_FIELDS)
      .populate("conversation", "name picture isGroup users")
      .populate("reportedStatus", "isPublic content file createdAt")
      .populate("evidence.sender", PERSON_FIELDS)
      .lean(),
    ReportModel.countDocuments(FILTERS[filter]),
  ]);

  // how often the same person has been reported is the clearest signal a single report cannot give
  const reportedIds = [
    ...new Set(
      reports
        .map((report) => report.reportedUser?._id)
        .filter(Boolean)
        .map(String)
    ),
  ];
  const openCounts = await ReportModel.aggregate([
    { $match: { ...FILTERS.open, reportedUser: { $in: reportedIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: "$reportedUser", count: { $sum: 1 } } },
  ]);
  const openFor = new Map(openCounts.map(({ _id, count }) => [String(_id), count]));

  return {
    reports: reports.map((report) => ({ ...asListed(report), openAbout: openFor.get(String(report.reportedUser?._id)) ?? 0 })),
    total,
    hasMore: skip + reports.length < total,
  };
};

const closeReport = async (actor, report_id, outcome) => {
  if (!mongoose.isValidObjectId(report_id)) throw createHttpError.NotFound("No such report");
  const closed = await ReportModel.findOneAndUpdate({ _id: report_id, outcome: { $exists: false } }, { outcome, closedBy: actor._id, closedAt: new Date() });
  if (!closed) throw createHttpError.BadRequest("That report has already been dealt with");
  return closed;
};

export const dismissReport = async (actor, report_id, { reason = "" }) => {
  const given = String(reason).trim();
  if (given.length > MAX_REPORT_NOTE) throw createHttpError.BadRequest(`Keep the reason under ${MAX_REPORT_NOTE} characters`);

  const report = await closeReport(actor, report_id, "dismissed", given);
  await recordAction({ actor: actor._id, action: "report_dismissed", target: report.reportedUser, reason: given });
};

// acting on a report closes it, so the queue follows what was actually done rather than needing a second step
export const markReportActioned = (actor, report_id) => report_id && closeReport(actor, report_id, "actioned");

// revealed messages are private content, so they are kept only as long as a closed case might be looked at again
export const sweepOldEvidence = async () => {
  const cutoff = new Date(Date.now() - EVIDENCE_KEPT_DAYS * 24 * 60 * 60 * 1000);
  const { modifiedCount } = await ReportModel.updateMany({ closedAt: { $lt: cutoff }, evidence: { $exists: true } }, { $unset: { evidence: 1 } });
  return modifiedCount;
};
