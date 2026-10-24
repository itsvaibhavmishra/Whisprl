// first, so every module after it can count on what an older phone lacks
import "@/utils/polyfills";
import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "@/index.css";
import App from "@/App";
import ScreenRouter from "@/components/ScreenRouter";
import SettingsProvider from "@/contexts/SettingsContext";
// redux imports
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/redux/store";
import { setDraft } from "@/redux/slices/chatSlice";

import { startErrorReports } from "@/utils/errorReports";
import { injectStore } from "@/utils/session";
import { carriedOver } from "@/utils/updateCarryOver";

// before anything renders, so a failure while starting is reported too
startErrorReports();

const root = ReactDOM.createRoot(document.getElementById("root"));

injectStore(store);

// a live update reloads while the app is away, so the screen and anything half typed come back as they were left
const carried = carriedOver();
if (carried) {
  window.history.replaceState(null, "", carried.path);
  Object.entries(carried.drafts ?? {}).forEach(([conversationId, text]) => store.dispatch(setDraft({ conversationId, text })));
}

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ReduxProvider store={store}>
        <SettingsProvider>
          <ScreenRouter>
            <GoogleOAuthProvider clientId={import.meta.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID}>
              <App />
            </GoogleOAuthProvider>
          </ScreenRouter>
        </SettingsProvider>
      </ReduxProvider>
    </HelmetProvider>
  </React.StrictMode>
);
