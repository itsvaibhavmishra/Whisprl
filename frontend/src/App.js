import ThemeSettings from "./components/settings";
import Router from "./routes";
import ThemeProvider from "./theme";

// Toast
import { Toaster } from "sonner";

import HelmetHandler from "./utils/helmetHandler";

import ReactGA from "react-ga4";
import useSettings from "./hooks/useSettings";
import { useMediaQuery, useTheme } from "@mui/material";

if (process.env.REACT_APP_GA_ID !== "") {
  ReactGA.initialize(process.env.REACT_APP_GA_ID);
}

function App() {
  const theme = useTheme();
  const { themeMode } = useSettings();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <ThemeProvider>
        <ThemeSettings>
          {/* Toast */}
          <Toaster
            position={isSmallScreen ? "top-center" : "top-right"}
            theme={themeMode}
            richColors
            closeButton
            duration={5000}
          />

          <Router />
        </ThemeSettings>
      </ThemeProvider>

      <HelmetHandler />
    </>
  );
}

export default App;
