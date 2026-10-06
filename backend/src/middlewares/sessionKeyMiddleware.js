import { assertSessionKey } from "#src/services/sessionService.js";

// checked before logging in, so an outdated page fails before it uses up a code, a captcha or a passkey challenge
export const requireSessionKey = (req, res, next) => {
  try {
    assertSessionKey(req.body.sessionKey);
    next();
  } catch (error) {
    next(error);
  }
};
