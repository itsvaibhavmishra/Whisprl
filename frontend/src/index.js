import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "swiper/css";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "@/index.css";
import App from "@/App";
import SettingsProvider from "@/contexts/SettingsContext";
// redux imports
import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/redux/store";

import { injectStore } from "@/utils/session";

const root = ReactDOM.createRoot(document.getElementById("root"));

injectStore(store);

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ReduxProvider store={store}>
        <SettingsProvider>
          <BrowserRouter>
            <GoogleOAuthProvider
              clientId={process.env.REACT_APP_GOOGLE_AUTH_CLIENT_ID}
            >
              <App />
            </GoogleOAuthProvider>
          </BrowserRouter>
        </SettingsProvider>
      </ReduxProvider>
    </HelmetProvider>
  </React.StrictMode>
);
