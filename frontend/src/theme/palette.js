import { alpha } from "@mui/material/styles";

import { defaultPreset } from "@/utils/colorPresets";

const NAVY = "#0F1A2B";

const SECONDARY = {
  lighter: "#D6E4FF",
  light: "#84A9FF",
  main: "#3366FF",
  dark: "#1939B7",
  darker: "#091A7A",
};
const INFO = {
  lighter: "#D0F2FF",
  light: "#74CAFF",
  main: "#1890FF",
  dark: "#0C53B7",
  darker: "#04297A",
};
const SUCCESS = {
  lighter: "#E9FCD4",
  light: "#7EE2A8",
  main: "#2BC48A",
  dark: "#178A5E",
  darker: "#08660D",
};
const WARNING = {
  lighter: "#FFF7CD",
  light: "#FFE16A",
  main: "#FFC107",
  dark: "#B78103",
  darker: "#7A4F01",
};
const ERROR = {
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
  500_12: alpha("#8A98AE", 0.12),
  500_24: alpha("#8A98AE", 0.24),
  500_32: alpha("#8A98AE", 0.32),
  500_80: alpha("#8A98AE", 0.8),
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
    // near black with only a trace of the mascot's cool blue, so the cyan accent stands out without the screen reading as navy
    text: { primary: "#ECEEF2", secondary: "#9BA1AB", disabled: "#737A85" },
    background: { paper: "#17191D", default: "#0E1013", neutral: alpha("#9BA1AB", 0.12) },
    divider: alpha("#FFFFFF", 0.08),
    action: { active: "#9BA1AB", ...action("#D6DAE1") },
    // each step up is a little lighter, so what floats reads as nearer: canvas, list, field, bubble, raised
    chat: {
      rail: "#08090B",
      list: "#0E1013",
      canvas: "#0A0B0D",
      raised: "#24272D",
      sheet: "#17191D",
      bubbleIn: "#1C1F24",
      glass: alpha("#0E1013", 0.86),
      pill: alpha("#1C1F24", 0.95),
      field: "#16181C",
      edge: alpha("#FFFFFF", 0.06),
      doodle: alpha("#D6DAE1", 0.045),
      shade: alpha("#000000", 0.5),
    },
  },
};

export default palette;
