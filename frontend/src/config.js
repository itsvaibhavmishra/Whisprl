import { enUS, hiIN, frFR, jaJP, viVN, hyAM, arSD } from "@mui/material/locale";
import { PATH_AUTH, PATH_DASHBOARD, PATH_DOCS } from "@/routes/paths";

export const SETTINGS_STORAGE_KEY = "settings";

export const defaultSettings = {
  themeMode: "dark",
  themeDirection: "ltr",
  themeColorPresets: "default",
  sounds: true,
  notifications: false,
  use24Hour: false,
  wallpapers: { all: "aurora", doodles: true, chats: {} },
};

export const NAVBAR = {
  BASE_WIDTH: 260,
  DASHBOARD_WIDTH: 280,
  DASHBOARD_COLLAPSE_WIDTH: 88,
  DASHBOARD_ITEM_ROOT_HEIGHT: 48,
  DASHBOARD_ITEM_SUB_HEIGHT: 40,
  DASHBOARD_ITEM_HORIZONTAL_HEIGHT: 32,
};

export const allLangs = [
  {
    label: "English",
    value: "en",
    systemValue: enUS,
  },
  {
    label: "Hindi",
    value: "hi",
    systemValue: hiIN,
  },
  {
    label: "French",
    value: "fr",
    systemValue: frFR,
  },
  {
    label: "Japanese",
    value: "ja",
    systemValue: jaJP,
  },
  {
    label: "Vietnamese",
    value: "vn",
    systemValue: viVN,
  },
  {
    label: "Armenian",
    value: "am",
    systemValue: hyAM,
  },
  {
    label: "Arabic (Sudan)",
    value: "ar",
    systemValue: arSD,
  },
];

export const defaultLang = allLangs[0]; // Default Language => English

export const DEFAULT_PATH = PATH_DASHBOARD.general.chat;
export const DEFAULT_AUTH = PATH_AUTH.general.welcome;
export const DEFAULT_DOCS = PATH_DOCS.general.tnc;

export const SITE_URL = "https://whisprl.netlify.app";
export const SOURCE_URL = "https://github.com/itsvaibhavmishra/Whisprl";
export const PORTFOLIO_URL = "https://vaibhaw.vercel.app";

export const COMMUNITY = {
  people: "400+",
  conversations: "150+",
  messages: "1k+",
};
