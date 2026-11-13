import createHttpError from "http-errors";

import { AuditEntryModel } from "#src/models/index.js";
import { MAX_AUDIT_REASON } from "#src/models/auditEntryModel.js";

export const assertReason = (reason) => {
  const given = typeof reason === "string" ? reason.trim() : "";
  if (!given) throw createHttpError.BadRequest("Say why you are doing this");
  if (given.length > MAX_AUDIT_REASON) throw createHttpError.BadRequest(`Keep the reason under ${MAX_AUDIT_REASON} characters`);
  return given;
};

export const recordAction = ({ actor, action, target, reason, permissions }) => AuditEntryModel.create({ actor, action, target, reason, permissions });
