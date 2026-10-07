import { alpha } from "@mui/material/styles";

import { defaultPreset } from "@/utils/colorPresets";

const NAVY = "#0F1A2B";

const SECONDARY = {
  lighterFaded: "#84A9FF40",
  lighterFade: "#84A9FFBF",
  lighter: "#D6E4FF",
  light: "#84A9FF",
  main: "#3366FF",
  dark: "#1939B7",
  darker: "#091A7A",
};
const INFO = {
  lighterFaded: "#74CAFF40",
  lighterFade: "#74CAFFBF",
  lighter: "#D0F2FF",
  light: "#74CAFF",
  main: "#1890FF",
  dark: "#0C53B7",
  darker: "#04297A",
};
const SUCCESS = {
  lighterFaded: "#AAF27F40",
  lighterFade: "#AAF27FBF",
  lighter: "#E9FCD4",
  light: "#7EE2A8",
  main: "#2BC48A",
  dark: "#178A5E",
  darker: "#08660D",
};
const WARNING = {
  lighterFaded: "#FFE16A40",
  lighterFade: "#FFE16ABF",
  lighter: "#FFF7CD",
  light: "#FFE16A",
  main: "#FFC107",
  dark: "#B78103",
  darker: "#7A4F01",
};
const ERROR = {
  lighterFaded: "#FFA48D40",
  lighterFade: "#FFA48DBF",
  lighter: "#FFE7D9",
  light: "#FF8A8A",
  main: "#E5484D",
  dark: "#B72136",
  darker: "#7A0C2E",
};

// cool silver greys with a navy cast, taken from the mascot's body and outline
const GREY = {
  0: "#FFFFFF",
  100: "#F7F9FC",
  200: "#EEF2F8",
  300: "#DCE3EE",
  400: "#B7C3D4",
  500: "#8A98AE",
  600: "#5F6E86",
  700: "#3A4860",
  800: "#1E2A3D",
  900: "#131C2B",
  500_8: alpha("#8A98AE", 0.08),
  500_12: alpha("#8A98AE", 0.12),
  500_16: alpha("#8A98AE", 0.16),
  500_24: alpha("#8A98AE", 0.24),
  500_32: alpha("#8A98AE", 0.32),
  500_48: alpha("#8A98AE", 0.48),
  500_56: alpha("#8A98AE", 0.56),
  500_80: alpha("#8A98AE", 0.8),
};

const CHART_COLORS = {
  violet: ["#826AF9", "#9E86FF", "#D0AEFF", "#F7D2FF"],
  blue: ["#2D99FF", "#83CFFF", "#A5F3FF", "#CCFAFF"],
  green: ["#2CD9C5", "#60F1C8", "#A4F7CC", "#C0F2DC"],
  yellow: ["#FFE700", "#FFEF5A", "#FFF7AE", "#FFF3D6"],
  red: ["#FF6C40", "#FF8F6D", "#FFBD98", "#FFF2D4"],
};

const COMMON = {
  common: { black: "#000", white: "#fff" },
  primary: defaultPreset,
  secondary: { ...SECONDARY, contrastText: "#fff" },
  info: { ...INFO, contrastText: "#fff" },
  success: { ...SUCCESS, contrastText: NAVY },
  warning: { ...WARNING, contrastText: NAVY },
  error: { ...ERROR, contrastText: "#fff" },
  grey: GREY,
  chart: CHART_COLORS,
};

const action = (hoverColor) => ({
  hover: alpha(hoverColor, 0.06),
  selected: alpha(hoverColor, 0.1),
  disabled: GREY[500_80],
  disabledBackground: GREY[500_24],
  focus: GREY[500_24],
  hoverOpacity: 0.06,
  disabledOpacity: 0.48,
});

const palette = {
  light: {
    ...COMMON,
    mode: "light",
    text: { primary: NAVY, secondary: GREY[600], disabled: GREY[500] },
    background: { paper: "#F1F4F9", default: "#FFFFFF", neutral: GREY[200] },
    divider: alpha(NAVY, 0.09),
    action: { active: GREY[600], ...action(NAVY) },
    chat: {
      rail: NAVY,
      list: "#FFFFFF",
      canvas: "#EEF3F9",
      raised: "#FFFFFF",
      sheet: "#FFFFFF",
      bubbleIn: "#FFFFFF",
      glass: alpha("#FFFFFF", 0.86),
      pill: alpha("#FFFFFF", 0.9),
      field: "#EEF2F8",
      edge: alpha(NAVY, 0.08),
      doodle: alpha(NAVY, 0.075),
      shade: alpha(NAVY, 0.08),
    },
  },
  dark: {
    ...COMMON,
    mode: "dark",
    text: { primary: "#E9EEF6", secondary: "#93A1B8", disabled: "#7B8AA2" },
    background: { paper: "#1A2334", default: "#0D1420", neutral: alpha("#93A1B8", 0.12) },
    divider: alpha("#9FB2D0", 0.1),
    action: { active: "#93A1B8", ...action("#C8D6EC") },
    // each step up is a little lighter, so what floats reads as nearer: canvas, list, field, bubble, raised
    chat: {
      rail: "#080C14",
      list: "#0D1420",
      canvas: "#080D15",
      raised: "#252F43",
      sheet: "#1A2334",
      bubbleIn: "#1E2839",
      glass: alpha("#0D1420", 0.86),
      pill: alpha("#1E2839", 0.95),
      field: "#151E2D",
      edge: alpha("#FFFFFF", 0.06),
      doodle: alpha("#C8D6EC", 0.05),
      shade: alpha("#000000", 0.45),
    },
  },
};

export default palette;
