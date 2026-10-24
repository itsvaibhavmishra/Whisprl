import { SETTINGS_STORAGE_KEY } from "@/config";
import { summaryOf } from "@/utils/messageSummary";
import { isApp } from "@/utils/platform";
import { askForPush, pushPermission } from "@/utils/push";

const APP_ICON = `${import.meta.env.BASE_URL}icon-192.png`;

const webPermission = () => ("Notification" in window ? Notification.permission : "unsupported");

export const notificationPermission = async () => (isApp ? pushPermission() : webPermission());

export const askForNotifications = () => (isApp ? askForPush() : Notification.requestPermission());

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

export const openNotifiedChat = (conversationId) => openChat(conversationId);

// only while Whisprl is in the background, since an open tab already plays a sound
export const notifyArrival = (message, conversation) => {
  if (!isSwitchedOn() || webPermission() !== "granted" || document.visibilityState === "visible") return;

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
