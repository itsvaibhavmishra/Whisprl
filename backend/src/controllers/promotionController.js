import { countVisit, joinPromotion, markStep, readPromotion } from "#src/services/promotionService.js";

export const read = async (req, res) => {
  res.status(200).json({ status: "success", ...(await readPromotion(req.params.code)) });
};

export const visit = async (req, res) => {
  await countVisit(req.params.code);
  res.status(200).json({ status: "success" });
};

export const join = async (req, res) => {
  res.status(200).json({ status: "success", ...(await joinPromotion(req.user, req.params.code)) });
};

export const reachStep = async (req, res) => {
  await markStep(req.user, req.params.code, req.params.step);
  res.status(200).json({ status: "success" });
};
