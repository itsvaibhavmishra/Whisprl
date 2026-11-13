import { assertConfirmed, confirmationOptions } from "#src/services/passkeyService.js";
import { addAdmin, changeAccess, listTeam, removeAdmin } from "#src/services/teamService.js";

export const getConfirmationOptions = async (req, res) => {
  return res.status(200).json({ status: "success", options: await confirmationOptions(req.user) });
};

const withPasskey = (act) => async (req, res) => {
  const { confirmation, ...details } = req.body;
  await assertConfirmed(req.user, confirmation);
  return res.status(200).json({ status: "success", ...(await act(req, details)) });
};

export const getTeam = async (req, res) => {
  return res.status(200).json({ status: "success", ...(await listTeam()) });
};

export const addToTeam = withPasskey((req, details) => addAdmin(req.user, details));

export const changeTeamAccess = withPasskey((req, details) => changeAccess(req.user, req.params.user_id, details));

export const removeFromTeam = withPasskey((req, details) => removeAdmin(req.user, req.params.user_id, details));
