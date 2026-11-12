import crypto from "crypto";

import { UserModel } from "#src/models/index.js";
import { platformOf } from "#src/services/activityService.js";
import { sendMail } from "#src/services/mailer.js";
import newDeviceMail from "#src/templates/mail/newDevice.js";

const KNOWN_DEVICES_KEPT = 10;
const DEVICE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// checked in order, since Edge and Opera also say Chrome, and Chrome also says Safari
const BROWSERS = [
  ["Edg", "Edge"],
  ["OPR/", "Opera"],
  ["SamsungBrowser/", "Samsung Internet"],
  ["Firefox/", "Firefox"],
  ["FxiOS/", "Firefox"],
  ["CriOS/", "Chrome"],
  ["Chrome/", "Chrome"],
  ["Safari/", "Safari"],
];

// checked in order, since Android also says Linux, and iPhones and iPads also say Mac OS X
const SYSTEMS = [
  ["Android", "Android"],
  ["iPhone", "iPhone"],
  ["iPad", "iPad"],
  ["Windows", "Windows"],
  ["CrOS", "ChromeOS"],
  ["Mac OS X", "Mac"],
  ["Linux", "Linux"],
];

const nameIn = (names, userAgent) => names.find(([marker]) => userAgent.includes(marker))?.[1];

export const isDeviceId = (deviceId) => typeof deviceId === "string" && DEVICE_ID.test(deviceId);

export const deviceNameOf = (userAgent = "", platform = "web") => {
  if (platform === "android") return "the Whisprl app on Android";
  const browser = nameIn(BROWSERS, userAgent);
  const system = nameIn(SYSTEMS, userAgent);
  if (browser && system) return `${browser} on ${system}`;
  return browser ?? system ?? "a device we don't recognise";
};

// hashed with the account, so two accounts used on one device cannot be matched up in the database
const deviceHashOf = (user_id, deviceId) => crypto.createHash("sha256").update(`${user_id}:${deviceId}`).digest("hex");

// returns what the account knew before, or null when it already knew this device
const rememberDevice = async (user_id, deviceId) => {
  const hash = deviceHashOf(user_id, deviceId);
  const seenAt = new Date();
  const before = await UserModel.findOneAndUpdate(
    { _id: user_id, "knownDevices.hash": { $ne: hash } },
    { $push: { knownDevices: { $each: [{ hash, seenAt }], $sort: { seenAt: 1 }, $slice: -KNOWN_DEVICES_KEPT } } },
    { projection: { knownDevices: 1 } }
  ).lean();
  if (before) return before.knownDevices ?? [];

  await UserModel.updateOne({ _id: user_id, "knownDevices.hash": hash }, { $set: { "knownDevices.$.seenAt": seenAt } });
  return null;
};

const logFailure = (error) => console.error(`[devices] ${error.message}`);

// a device that renews its session has been signed in all along, so it joins the known ones without a mail
export const noteRenewingDevice = (user_id, deviceId) => {
  if (isDeviceId(deviceId)) rememberDevice(user_id, deviceId).catch(logFailure);
};

// the first device an account is seen on is trusted, so signing up, or the first login after this shipped, sends nothing
const mailIfNewDevice = async (user, deviceId, req) => {
  const knownBefore = await rememberDevice(user._id, deviceId);
  if (!knownBefore?.length) return;

  const device = deviceNameOf(req.get("user-agent"), platformOf(req));
  await sendMail(user.email, "New login to your Whisprl account", newDeviceMail(user.firstName, device));
};

// noticing a new device must never stand in the way of signing in
export const noteLoginDevice = (user, deviceId, req) => {
  if (isDeviceId(deviceId)) mailIfNewDevice(user, deviceId, req).catch(logFailure);
};
