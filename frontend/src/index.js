import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "swiper/css";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "@/index.css";
import App from "@/App";
import ScreenRouter from "@/components/ScreenRouter";
import SettingsProvider from "@/contexts/SettingsContext";
// redux imports
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/redux/store";

import { startErrorReports } from "@/utils/errorReports";
import { injectStore } from "@/utils/session";

// before anything renders, so a failure while starting is reported too
startErrorReports();

const root = ReactDOM.createRoot(document.getElementById("root"));

injectStore(store);

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ReduxProvider store={store}>
        <SettingsProvider>
          <ScreenRouter>
            <GoogleOAuthProvider
              clientId={process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID}
            >
              <App />
            </GoogleOAuthProvider>
          </ScreenRouter>
        </SettingsProvider>
      </ReduxProvider>
    </HelmetProvider>
  </React.StrictMode>
);
