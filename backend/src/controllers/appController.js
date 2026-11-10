import { readUpdatePolicy } from "#src/services/updatePolicyService.js";

export const getUpdatePolicy = async (req, res) => {
  return res.status(200).json({ status: "success", policy: await readUpdatePolicy() });
};
