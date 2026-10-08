import createHttpError from "http-errors";

import { RequestCooldownModel } from "#src/models/index.js";

const HOUR_MS = 60 * 60 * 1000;
const COOLDOWN_MS = 24 * HOUR_MS;

// rounded up to the hour, so the wait reveals at most the hour a request ended in
const hoursUntil = (date) => Math.max(1, Math.ceil((date - Date.now()) / HOUR_MS));

export const startCooldown = (sender_id, recipient_id) =>
  RequestCooldownModel.updateOne({ sender: sender_id, recipient: recipient_id }, { until: new Date(Date.now() + COOLDOWN_MS) }, { upsert: true });

// the same words after a decline, a block or a late cancel, so they never say who ended the request
export const assertNoCooldown = async (sender_id, receiver) => {
  const cooldown = await RequestCooldownModel.findOne({ sender: sender_id, recipient: receiver._id, until: { $gt: new Date() } });
  if (!cooldown) return;

  const hours = hoursUntil(cooldown.until);
  throw createHttpError(429, `You can send ${receiver.firstName} a new request in ${hours} hour${hours === 1 ? "" : "s"}`, {
    code: "request_cooldown",
  });
};

export const cooldownsOf = async (sender_id) =>
  (await RequestCooldownModel.find({ sender: sender_id, until: { $gt: new Date() } }).lean()).map(({ recipient, until }) => ({ user: recipient, until }));
