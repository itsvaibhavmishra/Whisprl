import { addAccountKey, getOwnKeys, getPasskeyBackups, replaceKeyBackup, savePasskeyBackup } from "#src/services/keyService.js";
import { listPasskeys } from "#src/services/passkeyService.js";

export const getKeys = async (req, res) => {
  const keys = await getOwnKeys(req.user._id);
  res.status(200).json({ status: "success", ...keys });
};

export const addKey = async (req, res) => {
  const publicKeys = await addAccountKey(req.user, req.body);
  const { _id, friends } = req.user;

  req.app.get("io").to([_id, ...friends].map(String)).emit("keys_changed", { userId: _id, publicKeys });

  res.status(200).json({ status: "success", publicKeys });
};

export const updateBackup = async (req, res) => {
  await replaceKeyBackup(req.user, req.body);
  res.status(200).json({ status: "success", message: "Recovery key replaced" });
};

export const getPasskeyKeys = async (req, res) => {
  res.status(200).json({ status: "success", passkeys: await getPasskeyBackups(req.user._id) });
};

export const linkPasskey = async (req, res) => {
  await savePasskeyBackup(req.user, req.params.credential_id, req.body);

  res.status(200).json({ status: "success", message: "This passkey now unlocks your messages", passkeys: await listPasskeys(req.user._id) });
};
