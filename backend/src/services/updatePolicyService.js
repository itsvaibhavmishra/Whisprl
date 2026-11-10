import createHttpError from "http-errors";

import { UpdatePolicyModel } from "#src/models/index.js";
import { assertReason, recordAction } from "#src/services/auditService.js";

export const readUpdatePolicy = async () => {
  const policy = await UpdatePolicyModel.findOne().lean();
  return { isShown: Boolean(policy?.isShown), isListed: Boolean(policy?.isListed) };
};

const describe = ({ isShown, isListed }) => `${isShown ? "reminder shown" : "reminder hidden"}, ${isListed ? "Play listing open" : "Play listing closed"}`;

export const changeUpdatePolicy = async (actor, { isShown, isListed, reason }) => {
  const given = assertReason(reason);
  if (typeof isShown !== "boolean" || typeof isListed !== "boolean") throw createHttpError.BadRequest("Choose on or off for each");
  const policy = { isShown, isListed };

  await UpdatePolicyModel.updateOne({}, { $set: policy }, { upsert: true });
  await recordAction({ actor: actor._id, action: "app_updates_changed", reason: `${given} (${describe(policy)})` });
  return policy;
};
