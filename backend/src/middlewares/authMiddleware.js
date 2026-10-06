import { authenticate } from "../services/authService.js";

const bearerTokenOf = (req) => req.get("authorization")?.match(/^Bearer (.+)$/)?.[1];

// ------------------- Protected route middleware -------------------
export const protect = async (req, res, next) => {
  try {
    const { user, sessionId } = await authenticate(bearerTokenOf(req));
    req.user = user;
    req.sessionId = sessionId;
    next();
  } catch (error) {
    next(error);
  }
};
