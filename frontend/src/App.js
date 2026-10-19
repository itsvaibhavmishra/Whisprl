import { useEffect } from "react";

import CrashScreen from "@/components/CrashScreen";
import ThemeSettings from "@/components/theme-settings";
import Router from "@/routes";
import ThemeProvider from "@/theme";

// Toast
import { Toaster } from "sonner";

import { ErrorBoundary } from "@/utils/errorReports";
import HelmetHandler from "@/utils/helmetHandler";
import { startLiveUpdates } from "@/utils/liveUpdate";
import ScrollToTop from "@/components/ScrollToTop";
import OpenAppLinks from "@/components/OpenAppLinks";

import ReactGA from "react-ga4";
import useSettings from "@/hooks/useSettings";
import { useMediaQuery, useTheme } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

if (process.env.REACT_APP_GA_ID !== "") {
  ReactGA.initialize(process.env.REACT_APP_GA_ID);
}

// inside the error boundary, so a version that crashes while drawing never says it started, and is rolled back
const StartedSignal = () => {
  useEffect(() => {
    startLiveUpdates().catch(() => {});
  }, []);
  return null;
};

function App() {
  const theme = useTheme();
  const { themeMode, themeDirection } = useSettings();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <ThemeProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ThemeSettings>
            {/* Toast */}
            <Toaster
              position={isSmallScreen ? "top-center" : "top-right"}
              theme={themeMode}
              dir={themeDirection}
              visibleToasts={5}
              richColors
              closeButton
              duration={5000}
            />

            <ErrorBoundary fallback={({ error }) => <CrashScreen error={error} />}>
              <Router />
              <StartedSignal />
            </ErrorBoundary>
          </ThemeSettings>
        </LocalizationProvider>
      </ThemeProvider>

      <HelmetHandler />
      <ScrollToTop />
      <OpenAppLinks />
    </>
  );
}

export default App;
