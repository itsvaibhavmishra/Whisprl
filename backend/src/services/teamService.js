import createHttpError from "http-errors";
import mongoose from "mongoose";

import { UserModel } from "#src/models/index.js";
import { PERMISSIONS } from "#src/models/userModel.js";
import { assertReason, recordAction } from "#src/services/auditService.js";
import { isShutOut } from "#src/services/moderationService.js";
import { permissionsOf, roleOf } from "#src/services/roleService.js";
import { normalizeEmail } from "#src/utils/accountRules.js";

const MEMBER_FIELDS = "firstName lastName username email avatar role permissions";

const assertPermissions = (permissions) => {
  const chosen = Array.isArray(permissions) ? [...new Set(permissions)] : [];
  if (!chosen.length) throw createHttpError.BadRequest("Choose at least one thing they can do");
  if (!chosen.every((permission) => PERMISSIONS.includes(permission))) throw createHttpError.BadRequest("Choose permissions that exist");
  return chosen;
};

const asMember = (user) => ({ ...user, role: roleOf(user), permissions: permissionsOf(user) });

// the owner is whoever OWNER_EMAIL names, so its badge is moved to match at every start
export const syncOwnerBadge = async () => {
  const ownerEmail = normalizeEmail(process.env.OWNER_EMAIL);
  await UserModel.updateMany({ badge: "owner", email: { $ne: ownerEmail } }, { $unset: { badge: 1 } });
  if (ownerEmail) await UserModel.updateOne({ email: ownerEmail }, { badge: "owner" });
};

export const listTeam = async () => {
  const ownerEmail = normalizeEmail(process.env.OWNER_EMAIL);
  const found = await UserModel.find({ $or: [{ role: "admin" }, ...(ownerEmail ? [{ email: ownerEmail }] : [])] })
    .select(MEMBER_FIELDS)
    .sort({ createdAt: 1 })
    .lean();
  const members = found.map(asMember);
  return { members: [...members.filter(({ role }) => role === "owner"), ...members.filter(({ role }) => role !== "owner")] };
};

const findAdmin = async (user_id) => {
  const admin = mongoose.isValidObjectId(user_id) ? await UserModel.findById(user_id) : null;
  if (!admin || roleOf(admin) !== "admin") throw createHttpError.NotFound("That person is not an admin");
  return admin;
};

export const addAdmin = async (actor, { email, permissions, reason }) => {
  const given = assertReason(reason);
  const chosen = assertPermissions(permissions);
  const person = await UserModel.findOne({ email: normalizeEmail(email), verified: true });
  if (!person) throw createHttpError.NotFound("No verified account uses that email");
  if (roleOf(person) !== "user") throw createHttpError.BadRequest("They are already on the team");
  if (isShutOut(person)) throw createHttpError.BadRequest("Give them their access back before adding them");

  await UserModel.updateOne({ _id: person._id }, { role: "admin", permissions: chosen, badge: "admin" });
  await recordAction({ actor: actor._id, action: "admin_added", target: person._id, reason: given, permissions: chosen });
};

export const changeAccess = async (actor, user_id, { permissions, reason }) => {
  const given = assertReason(reason);
  const chosen = assertPermissions(permissions);
  const admin = await findAdmin(user_id);

  await UserModel.updateOne({ _id: admin._id }, { permissions: chosen });
  await recordAction({ actor: actor._id, action: "access_changed", target: admin._id, reason: given, permissions: chosen });
};

export const removeAdmin = async (actor, user_id, { reason }) => {
  const given = assertReason(reason);
  const admin = await findAdmin(user_id);

  await UserModel.updateOne({ _id: admin._id }, { role: "user", $unset: { permissions: 1, badge: 1 } });
  await recordAction({ actor: actor._id, action: "admin_removed", target: admin._id, reason: given });
};
