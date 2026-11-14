import { ReportModel } from "#src/models/index.js";
import { tellReporter } from "#src/services/whisprlMessageService.js";

const EVIDENCE_KEPT_DAYS = 90;
const OUTCOME_NOTICES = { actioned: "reportActioned", dismissed: "reportDismissed" };

// staff close reports outside the app, so each is claimed before the reporter is told, and two servers never tell twice
export const tellReporters = async (io) => {
  const waiting = await ReportModel.find({ awaitingNotice: true }).select("_id").lean();
  for (const { _id } of waiting) {
    const report = await ReportModel.findOneAndUpdate({ _id, awaitingNotice: true }, { $unset: { awaitingNotice: 1 } }).lean();
    if (report) await tellReporter(io, report, OUTCOME_NOTICES[report.outcome]);
  }
};

// revealed messages are private content, so they are kept only as long as a closed case might be looked at again
export const sweepOldEvidence = async () => {
  const cutoff = new Date(Date.now() - EVIDENCE_KEPT_DAYS * 24 * 60 * 60 * 1000);
  const { modifiedCount } = await ReportModel.updateMany({ closedAt: { $lt: cutoff }, evidence: { $exists: true } }, { $unset: { evidence: 1 } });
  return modifiedCount;
};
