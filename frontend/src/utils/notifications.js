import { SETTINGS_STORAGE_KEY } from "@/config";
import { summaryOf } from "@/utils/messageSummary";
import { isApp } from "@/utils/platform";
import { askForPush, clearPushedChat, pushPermission } from "@/utils/push";

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
let openPage = () => {};

const shownByChat = new Map();

// a notification is clicked from outside React, so the dashboard says how to open a chat
export const setChatOpener = (opener) => {
  openChat = opener;
};

export const openNotifiedChat = (conversationId) => openChat(conversationId);

export const setPageOpener = (opener) => {
  openPage = opener;
};

// a page named by a push is only ever one of Whisprl's own, never an address elsewhere
const isOwnPage = (path) => typeof path === "string" && path.startsWith("/") && !path.startsWith("//");

export const openNotified = ({ conversationId, path }) => (isOwnPage(path) ? openPage(path) : openChat(conversationId));

// news that belongs to no chat, like a friend request, shown the same way while the tab is in the background
export const notifyNews = ({ title, body, icon, tag, path }) => {
  if (isApp || !isSwitchedOn() || webPermission() !== "granted" || document.visibilityState === "visible") return;
  const notification = new Notification(title, { body, icon: icon || APP_ICON, tag });
  notification.onclick = () => {
    window.focus();
    openPage(path);
    notification.close();
  };
};

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
  shownByChat.set(conversation._id, notification);
};

// a chat read here or on another device has nothing left to tell about
export const clearChatNotification = (conversationId) => {
  if (isApp) {
    clearPushedChat(conversationId).catch(() => {});
    return;
  }
  shownByChat.get(conversationId)?.close();
  shownByChat.delete(conversationId);
};
