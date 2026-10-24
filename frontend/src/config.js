import { PATH_AUTH, PATH_DASHBOARD, PATH_DOCS } from "@/routes/paths";

export const SETTINGS_STORAGE_KEY = "settings";

export const defaultSettings = {
  themeMode: "dark",
  themeColorPresets: "default",
  sounds: true,
  haptics: true,
  appLock: false,
  notifications: false,
  use24Hour: false,
  wallpapers: { all: "aurora", doodles: true, chats: {} },
};

export const DEFAULT_PATH = PATH_DASHBOARD.general.chat;
export const DEFAULT_AUTH = PATH_AUTH.general.welcome;
export const DEFAULT_DOCS = PATH_DOCS.general.tnc;

export const SITE_URL = "https://whisprl.netlify.app";
export const SOURCE_URL = "https://github.com/itsvaibhavmishra/Whisprl";
export const PORTFOLIO_URL = "https://vaibhaw.vercel.app";
export const CONTACT_EMAIL = "whisprlai@gmail.com";

export const COMMUNITY = {
  people: "400+",
  conversations: "150+",
  messages: "1k+",
};
