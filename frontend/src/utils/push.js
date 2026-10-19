import { registerPlugin } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

const PushSetup = registerPlugin("PushSetup");

// Capacitor names the states the way iOS does, so they are read back in the browser's words
const PERMISSION = { granted: "granted", denied: "denied", prompt: "default", "prompt-with-rationale": "default" };

const isPushAvailable = async () => (await PushSetup.isAvailable()).available;

export const pushPermission = async () => ((await isPushAvailable()) ? PERMISSION[(await PushNotifications.checkPermissions()).receive] : "unsupported");

export const askForPush = async () => PERMISSION[(await PushNotifications.requestPermissions()).receive];

export const registerForPush = async () => {
  let settle;
  const token = new Promise((resolve, reject) => {
    settle = { resolve, reject };
  });
  const listeners = await Promise.all([
    PushNotifications.addListener("registration", ({ value }) => settle.resolve(value)),
    PushNotifications.addListener("registrationError", ({ error }) => settle.reject(new Error(error))),
  ]);
  try {
    await PushNotifications.register();
    return await token;
  } finally {
    listeners.forEach((listener) => listener.remove());
  }
};

export const stopPush = async () => {
  if (await isPushAvailable()) await PushNotifications.unregister();
};

export const listenForPushTaps = (onOpen) => {
  const listening = PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => onOpen(notification.data.conversationId));
  return () => listening.then((listener) => listener.remove());
};
