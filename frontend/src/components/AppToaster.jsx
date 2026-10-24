import { GlobalStyles, useMediaQuery, useTheme } from "@mui/material";
import { Toaster } from "sonner";

import useSettings from "@/hooks/useSettings";

// repeated so it outranks the library's own rules for the same element
const TOASTER = "[data-sonner-toaster][data-sonner-toaster][data-y-position]";
// on a phone a toast sits just above the message box and the tab bar, where Android's own toasts appear
const ABOVE_BOTTOM_BAR = "calc(80px + env(safe-area-inset-bottom))";

const SEVERITIES = ["success", "info", "warning", "error"];

const AppToaster = () => {
  const theme = useTheme();
  const { themeMode } = useSettings();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <GlobalStyles
        styles={{
          [theme.breakpoints.down("md")]: { [TOASTER]: { bottom: ABOVE_BOTTOM_BAR } },
          // the library widens its phone layout past the screen edge, which pushes a narrow toast off centre
          "@media (max-width: 600px)": { [TOASTER]: { left: 16, right: 16, width: "auto" } },
          "[data-sonner-toaster] [data-sonner-toast][data-styled='true']": {
            width: "fit-content",
            maxWidth: "100%",
            marginInline: "auto",
            padding: "12px 20px",
            gap: 10,
            borderRadius: 24,
            border: "none",
            background: theme.palette.chat.raised,
            color: theme.palette.text.primary,
            boxShadow: theme.customShadows.dropdown,
            fontFamily: theme.typography.fontFamily,
            fontSize: 15,
            fontWeight: 500,
          },
          ...Object.fromEntries(
            SEVERITIES.map((severity) => [`[data-sonner-toast][data-type='${severity}'] [data-icon]`, { color: theme.palette[severity].main }])
          ),
        }}
      />
      <Toaster position={isSmallScreen ? "bottom-center" : "top-center"} theme={themeMode} visibleToasts={3} duration={4000} />
    </>
  );
};

export default AppToaster;
