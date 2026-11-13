import { UpdatePolicyModel } from "#src/models/index.js";

export const readUpdatePolicy = async () => {
  const policy = await UpdatePolicyModel.findOne().lean();
  return { isShown: Boolean(policy?.isShown), isListed: Boolean(policy?.isListed) };
};
