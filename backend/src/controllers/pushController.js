import { forgetDeviceToken, saveDeviceToken } from "#src/services/pushService.js";

export const saveDevice = async (req, res) => {
  await saveDeviceToken(req.sessionId, req.body.token);
  return res.status(200).json({ status: "success" });
};

export const forgetDevice = async (req, res) => {
  await forgetDeviceToken(req.sessionId);
  return res.status(200).json({ status: "success" });
};
