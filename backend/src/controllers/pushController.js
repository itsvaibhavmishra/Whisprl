import { forgetDeviceToken, saveDeviceToken } from "#src/services/pushService.js";

export const saveDevice = async (req, res, next) => {
  try {
    await saveDeviceToken(req.sessionId, req.body.token);
    return res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};

export const forgetDevice = async (req, res, next) => {
  try {
    await forgetDeviceToken(req.sessionId);
    return res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};
