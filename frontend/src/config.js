import { enUS, hiIN, frFR, jaJP, viVN, hyAM, arSD } from "@mui/material/locale";
import { PATH_AUTH, PATH_DASHBOARD, PATH_DOCS } from "./routes/paths";

export const defaultSettings = {
  themeMode: "dark",
  themeDirection: "ltr",
  themeContrast: "default",
  themeLayout: "horizontal",
  themeColorPresets: "default",
  themeStretch: false,
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
    icon: "/assets/icons/flags/flag_en.svg",
  },
  {
    label: "Hindi",
    value: "hi",
    systemValue: hiIN,
    icon: "/assets/icons/flags/flag_hi.svg",
  },
  {
    label: "French",
    value: "fr",
    systemValue: frFR,
    icon: "/assets/icons/flags/flag_fr.svg",
  },
  {
    label: "Japanese",
    value: "ja",
    systemValue: jaJP,
    icon: "/assets/icons/flags/flag_ja.svg",
  },
  {
    label: "Vietnamese",
    value: "vn",
    systemValue: viVN,
    icon: "/assets/icons/flags/flag_vn.svg",
  },
  {
    label: "Armenian",
    value: "am",
    systemValue: hyAM,
    icon: "/assets/icons/flags/flag_am.svg",
  },
  {
    label: "Arabic (Sudan)",
    value: "ar",
    systemValue: arSD,
    icon: "/assets/icons/flags/flag_am.svg",
  },
];

export const defaultLang = allLangs[0]; // Default Language => English

export const DEFAULT_PATH = PATH_DASHBOARD.general.app;
export const DEFAULT_AUTH = PATH_AUTH.general.welcome;
export const DEFAULT_DOCS = PATH_DOCS.general.docs;

export const SITE_URL = "https://whisprl.netlify.app";
export const SOURCE_URL = "https://github.com/itsvaibhavmishra/Whisprl";
export const PORTFOLIO_URL = "https://vaibhaw.vercel.app";

export const COMMUNITY = {
  people: "400+",
  conversations: "150+",
  messages: "1k+",
};
