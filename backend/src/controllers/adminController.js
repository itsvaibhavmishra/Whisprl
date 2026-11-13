import { announce, announcedGames, audienceSizes, listAnnouncements } from "#src/services/announcementService.js";
import { assertConfirmed, confirmationOptions } from "#src/services/passkeyService.js";
import { addAdmin, changeAccess, listTeam, removeAdmin } from "#src/services/teamService.js";
import { changeUpdatePolicy } from "#src/services/updatePolicyService.js";

export const getConfirmationOptions = async (req, res) => {
  return res.status(200).json({ status: "success", options: await confirmationOptions(req.user) });
};

const withPasskey = (act) => async (req, res) => {
  const { confirmation, ...details } = req.body;
  await assertConfirmed(req.user, confirmation);
  return res.status(200).json({ status: "success", ...(await act(req, details)) });
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
