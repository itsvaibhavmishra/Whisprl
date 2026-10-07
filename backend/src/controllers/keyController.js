import { addAccountKey, getOwnKeys, getPasskeyBackups, replaceKeyBackup, savePasskeyBackup } from "#src/services/keyService.js";
import { listPasskeys } from "#src/services/passkeyService.js";

// -------------------------- Own Keys --------------------------
export const getKeys = async (req, res, next) => {
  try {
    const keys = await getOwnKeys(req.user._id);
    res.status(200).json({ status: "success", ...keys });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Add Key --------------------------
export const addKey = async (req, res, next) => {
  try {
    const publicKeys = await addAccountKey(req.user, req.body);
    const { _id, friends } = req.user;

    req.app.get("io").to([_id, ...friends].map(String)).emit("keys_changed", { userId: _id, publicKeys });

    res.status(200).json({ status: "success", publicKeys });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Replace Backup --------------------------
export const updateBackup = async (req, res, next) => {
  try {
    await replaceKeyBackup(req.user, req.body);
    res.status(200).json({ status: "success", message: "Recovery key replaced" });
  } catch (error) {
    next(error);
  }
};

// -------------------------- Passkey Copies Of The Key --------------------------
export const getPasskeyKeys = async (req, res, next) => {
  try {
    res.status(200).json({ status: "success", passkeys: await getPasskeyBackups(req.user._id) });
  } catch (error) {
    next(error);
  }
};

export const linkPasskey = async (req, res, next) => {
  try {
    await savePasskeyBackup(req.user, req.params.credential_id, req.body);

    res.status(200).json({ status: "success", message: "This passkey now unlocks your messages", passkeys: await listPasskeys(req.user._id) });
  } catch (error) {
    next(error);
  }
};
