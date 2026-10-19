import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { App } from "@capacitor/app";

import { isApp } from "@/utils/platform";

// a website link the phone hands to the app opens the same page in it
const OpenAppLinks = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isApp) return undefined;
    const listening = App.addListener("appUrlOpen", ({ url }) => {
      const { pathname, search } = new URL(url);
      navigate(`${pathname}${search}`);
    });
    return () => listening.then((listener) => listener.remove());
  }, [navigate]);

  return null;
};

export default OpenAppLinks;
