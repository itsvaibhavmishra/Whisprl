import {
  listPasskeys,
  loginWithPasskey,
  passkeyLoginOptions,
  passkeyRegistrationOptions,
  registerPasskey,
  removePasskey,
} from "#src/services/passkeyService.js";
import { respondWithSession } from "#src/controllers/authController.js";

// -------------------------- List Passkeys --------------------------
export const getPasskeys = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", passkeys: await listPasskeys(req.user._id) });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Add Passkey --------------------------
export const getRegistrationOptions = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", options: await passkeyRegistrationOptions(req.user) });
  } catch (error) {
    next(error);
  }
};

export const addPasskey = async (req, res, next) => {
  try {
    await registerPasskey(req.user, req.body.response);

    res.status(200).json({ status: "success", message: "Passkey added", passkeys: await listPasskeys(req.user._id) });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Remove Passkey --------------------------
export const deletePasskey = async (req, res, next) => {
  try {
    await removePasskey(req.user._id, req.params.passkey_id);

    res.status(200).json({ status: "success", message: "Passkey removed", passkeys: await listPasskeys(req.user._id) });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Log In With Passkey --------------------------
export const getLoginOptions = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", options: await passkeyLoginOptions() });
  } catch (error) {
    next(error);
  }
};

export const passkeyLogin = async (req, res, next) => {
  try {
    const { user, keyBackup } = await loginWithPasskey(req.body.response);

    await respondWithSession(req, res, user, "Logged in successfully", { keyBackup });
  } catch (error) {
    next(error);
  }
};
