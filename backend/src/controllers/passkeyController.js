import {
  listPasskeys,
  loginWithPasskey,
  passkeyLoginOptions,
  passkeyRegistrationOptions,
  registerPasskey,
  removePasskey,
} from "#src/services/passkeyService.js";
import { respondWithSession } from "#src/controllers/authController.js";

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

export const getLoginOptions = async (req, res) => {
  res.status(200).json({ status: "success", options: await passkeyLoginOptions() });
};

export const passkeyLogin = async (req, res) => {
  const { user, keyBackup } = await loginWithPasskey(req.body.response);

  await respondWithSession(req, res, user, "Logged in successfully", { keyBackup });
};
