import { PERMISSIONS } from "#src/models/userModel.js";
import { normalizeEmail } from "#src/utils/accountRules.js";

// an account made before roles existed has no stored role, and anything but "admin" must read as an ordinary user
export const roleOf = (user) => {
  if (user.email === normalizeEmail(process.env.OWNER_EMAIL)) return "owner";
  return user.role === "admin" ? "admin" : "user";
};

export const isStaff = (user) => roleOf(user) !== "user";

// running the team is the owner's alone, so it is not among the permissions an admin can be given
export const permissionsOf = (user) => {
  const role = roleOf(user);
  if (role === "owner") return [...PERMISSIONS, "team"];
  return role === "admin" ? (user.permissions ?? []).filter((permission) => PERMISSIONS.includes(permission)) : [];
};

export const can = (user, permission) => permissionsOf(user).includes(permission);
