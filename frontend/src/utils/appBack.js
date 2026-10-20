import { DEFAULT_AUTH, DEFAULT_PATH } from "@/config";

export const PREVIOUS_PAGE = "previous";

// one level up, then the chats from any other tab, and past the chats the app goes to the background
export const backTargetOf = (pathname) => {
  const [section, page] = pathname.split("/").filter(Boolean);
  if (section === "auth") return page === "welcome" ? null : DEFAULT_AUTH;
  if (section === "setup") return null;
  if (section === "docs" || section === "admin") return PREVIOUS_PAGE;
  if (page) return `/${section}`;
  if (section === "chat") return null;
  return DEFAULT_PATH;
};

const screenBacks = [];
const watchers = new Set();

const announce = () => watchers.forEach((watcher) => watcher());

// the screen opened most recently answers the back button, the way its own back arrow does
export const addScreenBack = (goBack) => {
  screenBacks.push(goBack);
  announce();
  return () => {
    screenBacks.splice(screenBacks.indexOf(goBack), 1);
    announce();
  };
};

export const watchScreenBacks = (watcher) => {
  watchers.add(watcher);
  return () => watchers.delete(watcher);
};

export const latestScreenBack = () => screenBacks.at(-1);

let backPreviews = 0;

// a screen that keeps the one behind it on the page can show it while a back swipe is still moving
export const addBackPreview = () => {
  backPreviews += 1;
  return () => {
    backPreviews -= 1;
  };
};

export const canPreviewBack = () => backPreviews > 0;
