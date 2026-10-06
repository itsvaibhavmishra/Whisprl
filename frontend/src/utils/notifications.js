import { SETTINGS_STORAGE_KEY } from "@/config";
import { summaryOf } from "@/utils/messageSummary";

const APP_ICON = `${process.env.PUBLIC_URL}/icon-192.png`;

export const notificationPermission = () => ("Notification" in window ? Notification.permission : "unsupported");

export const askForNotifications = () => Notification.requestPermission();

const isSwitchedOn = () => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY))?.notifications === true;
  } catch {
    return false;
  }
};

let openChat = () => {};

// a notification is clicked from outside React, so the dashboard says how to open a chat
export const setChatOpener = (opener) => {
  openChat = opener;
};

// only while Whisprl is in the background, since an open tab already plays a sound
export const notifyArrival = (message, conversation) => {
  if (!isSwitchedOn() || notificationPermission() !== "granted" || document.visibilityState === "visible") return;

  const { sender } = message;
  const text = summaryOf(message);
  const notification = new Notification(conversation.isGroup ? conversation.name : `${sender.firstName} ${sender.lastName}`, {
    body: conversation.isGroup ? `${sender.firstName}: ${text}` : text,
    icon: sender.avatar || APP_ICON,
    tag: conversation._id,
  });
  notification.onclick = () => {
    window.focus();
    openChat(conversation._id);
    notification.close();
  };
};
