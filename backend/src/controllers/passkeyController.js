import { listPasskeys, passkeyRegistrationOptions, registerPasskey, removePasskey } from "#src/services/passkeyService.js";

export const getPasskeys = async (req, res) => {
  res.status(200).json({ status: "success", passkeys: await listPasskeys(req.user._id) });
};

export const getRegistrationOptions = async (req, res) => {
  res.status(200).json({ status: "success", ...(await passkeyRegistrationOptions(req.user)) });
};

export const addPasskey = async (req, res) => {
  await registerPasskey(req.user, req.body.response, req.body.confirmation);

  res.status(200).json({ status: "success", message: "Passkey added", passkeys: await listPasskeys(req.user._id) });
};

export const deletePasskey = async (req, res) => {
  await removePasskey(req.user, req.params.passkey_id, req.body?.confirmation);

  res.status(200).json({ status: "success", message: "Passkey removed", passkeys: await listPasskeys(req.user._id) });
};
