import { listAuditEntries } from "#src/services/auditService.js";
import { closeGameRequests, listGameRequests } from "#src/services/gameRequestService.js";
import { banPerson, listPeople, restorePerson, suspendPerson } from "#src/services/moderationService.js";
import { dismissReport, listReports } from "#src/services/reportQueueService.js";
import { assertConfirmed, confirmationOptions } from "#src/services/passkeyService.js";
import { activePeopleOf, overviewOf } from "#src/services/overviewService.js";
import { addAdmin, changeAccess, listTeam, removeAdmin } from "#src/services/teamService.js";

// -------------------------- Overview --------------------------
export const getOverview = async (req, res, next) => {
  try {
    return res.status(200).json({ status: "success", ...(await overviewOf(req.query.from, req.query.to)) });
  } catch (error) {
    next(error);
  }
};

export const getActivePeople = async (req, res, next) => {
  try {
    return res.status(200).json({ status: "success", ...(await activePeopleOf(req.query.from, req.query.to, req.query.page)) });
  } catch (error) {
    next(error);
  }
};

// -------------------------- People --------------------------
export const getPeople = async (req, res, next) => {
  try {
    const { search, filter = "all", page } = req.query;
    return res.status(200).json({ status: "success", ...(await listPeople({ search, filter, page })) });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Confirming who is acting --------------------------
export const getConfirmationOptions = async (req, res, next) => {
  try {
    return res.status(200).json({ status: "success", options: await confirmationOptions(req.user) });
  } catch (error) {
    next(error);
  }
};

const withPasskey = (act) => async (req, res, next) => {
  try {
    const { confirmation, ...details } = req.body;
    await assertConfirmed(req.user, confirmation);
    await act(req, details);
    return res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};

export const suspend = withPasskey((req, details) => suspendPerson(req.app.get("io"), req.user, req.params.user_id, details));

export const ban = withPasskey((req, details) => banPerson(req.app.get("io"), req.user, req.params.user_id, details));

export const restore = withPasskey((req, details) => restorePerson(req.user, req.params.user_id, details));

// -------------------------- Game requests --------------------------
export const getGameRequests = async (req, res, next) => {
  try {
    const { status, kind, search, page } = req.query;
    return res.status(200).json({ status: "success", ...(await listGameRequests({ status, kind, search, page })) });
  } catch (error) {
    next(error);
  }
};

export const closeGameRequest = async (req, res, next) => {
  try {
    await closeGameRequests(req.user, req.params.name_key, req.body.outcome);
    return res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Reports --------------------------
export const getReports = async (req, res, next) => {
  try {
    const { filter = "open", page } = req.query;
    return res.status(200).json({ status: "success", ...(await listReports({ filter, page })) });
  } catch (error) {
    next(error);
  }
};

// dismissing changes nobody's access, so unlike the others it does not ask for the passkey
export const dismiss = async (req, res, next) => {
  try {
    await dismissReport(req.user, req.params.report_id, req.body);
    return res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Audit log --------------------------
export const getAuditLog = async (req, res, next) => {
  try {
    return res.status(200).json({ status: "success", ...(await listAuditEntries(req.query.before)) });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Team --------------------------
export const getTeam = async (req, res, next) => {
  try {
    return res.status(200).json({ status: "success", ...(await listTeam()) });
  } catch (error) {
    next(error);
  }
};

export const addToTeam = withPasskey((req, details) => addAdmin(req.user, details));

export const changeTeamAccess = withPasskey((req, details) => changeAccess(req.user, req.params.user_id, details));

export const removeFromTeam = withPasskey((req, details) => removeAdmin(req.user, req.params.user_id, details));
