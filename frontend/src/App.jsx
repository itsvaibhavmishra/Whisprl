import { useEffect } from "react";

import CrashScreen from "@/components/CrashScreen";
import ThemeColorPresets from "@/components/theme-settings/ThemeColorPresets";
import Router from "@/routes";
import ThemeProvider from "@/theme";

import { ErrorBoundary } from "@/utils/errorReports";
import HelmetHandler from "@/utils/helmetHandler";
import { startLiveUpdates } from "@/utils/liveUpdate";
import AppToaster from "@/components/AppToaster";
import ScrollToTop from "@/components/ScrollToTop";
import AppBackButton from "@/components/AppBackButton";
import AppLock from "@/components/AppLock";
import OpenAppLinks from "@/components/OpenAppLinks";

import ReactGA from "react-ga4";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

if (import.meta.env.REACT_APP_GA_ID) {
  ReactGA.initialize(import.meta.env.REACT_APP_GA_ID);
}

// inside the error boundary, so a version that crashes while drawing never says it started, and is rolled back
const StartedSignal = () => {
  useEffect(() => {
    startLiveUpdates().catch(() => {});
  }, []);
  return null;
};

function App() {
  return (
    <>
      <ThemeProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ThemeColorPresets>
            <AppToaster />

            <ErrorBoundary fallback={({ error }) => <CrashScreen error={error} />}>
              <Router />
              <AppLock />
              <StartedSignal />
            </ErrorBoundary>
          </ThemeColorPresets>
        </LocalizationProvider>
      </ThemeProvider>

      <HelmetHandler />
      <ScrollToTop />
      <OpenAppLinks />
      <AppBackButton />
    </>
  );
}

export default App;
