import createHttpError from "http-errors";

import { authenticate } from "#src/services/authService.js";
import { can, isStaff } from "#src/services/roleService.js";

const bearerTokenOf = (req) => req.get("authorization")?.match(/^Bearer (.+)$/)?.[1];

export const protect = async (req, res, next) => {
  const { user, sessionId } = await authenticate(bearerTokenOf(req));
  req.user = user;
  req.sessionId = sessionId;
  next();
};

// anyone else leaves this router as if it were not there, so they meet the same 404 as any unknown address
export const staffOnly = (req, res, next) => next(isStaff(req.user) ? undefined : "router");

export const allow = (permission) => (req, res, next) =>
  next(can(req.user, permission) ? undefined : createHttpError.Forbidden("Your access does not include this"));
