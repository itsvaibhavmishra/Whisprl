import { announce, announcedGames, audienceSizes, listAnnouncements } from "#src/services/announcementService.js";
import { listAuditEntries } from "#src/services/auditService.js";
import { closeGameRequests, listGameRequests } from "#src/services/gameRequestService.js";
import { banPerson, listPeople, restorePerson, suspendPerson } from "#src/services/moderationService.js";
import { dismissReport, listReports } from "#src/services/reportQueueService.js";
import { assertConfirmed, confirmationOptions } from "#src/services/passkeyService.js";
import { addAdmin, changeAccess, listTeam, removeAdmin } from "#src/services/teamService.js";
import { changeUpdatePolicy } from "#src/services/updatePolicyService.js";

export const getPeople = async (req, res) => {
  const { search, filter = "all", page } = req.query;
  return res.status(200).json({ status: "success", ...(await listPeople({ search, filter, page })) });
};

export const getConfirmationOptions = async (req, res) => {
  return res.status(200).json({ status: "success", options: await confirmationOptions(req.user) });
};

const withPasskey = (act) => async (req, res) => {
  const { confirmation, ...details } = req.body;
  await assertConfirmed(req.user, confirmation);
  return res.status(200).json({ status: "success", ...(await act(req, details)) });
};

export const suspend = withPasskey((req, details) => suspendPerson(req.app.get("io"), req.user, req.params.user_id, details));

export const ban = withPasskey((req, details) => banPerson(req.app.get("io"), req.user, req.params.user_id, details));

export const restore = withPasskey((req, details) => restorePerson(req.user, req.params.user_id, details));

export const getGameRequests = async (req, res) => {
  const { status, kind, search, page } = req.query;
  return res.status(200).json({ status: "success", ...(await listGameRequests({ status, kind, search, page })) });
};

export const closeGameRequest = async (req, res) => {
  await closeGameRequests(req.app.get("io"), req.user, req.params.name_key, req.body.outcome);
  return res.status(200).json({ status: "success" });
};

export const getReports = async (req, res) => {
  const { filter = "open", page } = req.query;
  return res.status(200).json({ status: "success", ...(await listReports({ filter, page })) });
};

// dismissing changes nobody's access, so unlike the others it does not ask for the passkey
export const dismiss = async (req, res) => {
  await dismissReport(req.app.get("io"), req.user, req.params.report_id, req.body);
  return res.status(200).json({ status: "success" });
};

export const getAuditLog = async (req, res) => {
  return res.status(200).json({ status: "success", ...(await listAuditEntries(req.query.before)) });
};

export const getAnnouncements = async (req, res) => {
  return res.status(200).json({ status: "success", ...(await listAnnouncements(req.query.before)) });
};

export const getAudienceSizes = async (req, res) => {
  return res.status(200).json({ status: "success", sizes: await audienceSizes() });
};

export const getAnnouncedGames = async (req, res) => {
  return res.status(200).json({ status: "success", games: await announcedGames() });
};

// it changes nobody's access, so like dismissing a report it does not ask for the passkey
export const sendAnnouncement = async (req, res) => {
  const announcement = await announce(req.app.get("io"), req.user, req.body);
  return res.status(200).json({ status: "success", announcement });
};

export const getTeam = async (req, res) => {
  return res.status(200).json({ status: "success", ...(await listTeam()) });
};

export const addToTeam = withPasskey((req, details) => addAdmin(req.user, details));

export const changeTeamAccess = withPasskey((req, details) => changeAccess(req.user, req.params.user_id, details));

export const removeFromTeam = withPasskey((req, details) => removeAdmin(req.user, req.params.user_id, details));

export const changeAppUpdates = withPasskey(async (req, details) => ({ policy: await changeUpdatePolicy(req.user, details) }));
