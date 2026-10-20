import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App } from "@capacitor/app";
import { registerPlugin } from "@capacitor/core";

import { DEFAULT_PATH } from "@/config";
import { PREVIOUS_PAGE, backTargetOf, canPreviewBack, latestScreenBack, watchScreenBacks } from "@/utils/appBack";
import { isApp } from "@/utils/platform";
import { startBackSwipe } from "@/utils/backSwipe";

const BackGesture = registerPlugin("BackGesture");

const openLayers = () => document.querySelectorAll(".MuiModal-root:not(.MuiModal-hidden)");

const isLocked = () => Boolean(document.querySelector("[data-app-locked]"));

// whatever sits on top, a dialog, a menu or the status viewer, closes first, the way Escape closes it
const closeTopLayer = () => {
  const layers = openLayers();
  const top = layers[layers.length - 1];
  if (!top) return false;
  top.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  return true;
};

const AppBackButton = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const currentPath = useRef(pathname);

  useEffect(() => {
    currentPath.current = pathname;
  }, [pathname]);

  // with nothing left to close or go up to, Android takes the back and draws its own way home as the swipe moves
  useEffect(() => {
    if (!isApp) return undefined;
    let isHandling = null;
    const update = () => {
      const hasSomewhereToGo = openLayers().length > 0 || Boolean(latestScreenBack()) || backTargetOf(currentPath.current) !== null;
      if (hasSomewhereToGo === isHandling) return;
      isHandling = hasSomewhereToGo;
      BackGesture.setHandling({ handling: hasSomewhereToGo });
    };
    update();
    // dialogs and menus open as children of the page's body, so watching its children sees each one come and go
    const layers = new MutationObserver(update);
    layers.observe(document.body, { childList: true });
    const stopWatching = watchScreenBacks(update);
    return () => {
      layers.disconnect();
      stopWatching();
    };
  }, [pathname]);

  useEffect(() => {
    if (!isApp) return undefined;

    const goBack = () => {
      if (isLocked()) {
        App.minimizeApp();
        return;
      }
      if (closeTopLayer()) return;
      const screenBack = latestScreenBack();
      if (screenBack) {
        screenBack();
        return;
      }
      const target = backTargetOf(currentPath.current);
      if (target === PREVIOUS_PAGE) navigate(window.history.state?.idx > 0 ? -1 : DEFAULT_PATH);
      else if (target) navigate(target);
      else App.minimizeApp();
    };

    // a swipe that would only close something on top, or leave a screen with nothing kept behind it, waits for its release
    const canPreview = () => canPreviewBack() && !openLayers().length && !latestScreenBack() && !isLocked();
    let swipe = null;

    const listening = [
      BackGesture.addListener("start", () => {
        swipe = canPreview() ? startBackSwipe() : null;
      }),
      BackGesture.addListener("progress", ({ progress }) => swipe?.follow(progress)),
      BackGesture.addListener("cancel", () => {
        swipe?.cancel();
        swipe = null;
      }),
      BackGesture.addListener("back", () => {
        if (swipe) swipe.complete(goBack);
        else goBack();
        swipe = null;
      }),
    ];
    return () => listening.forEach((added) => added.then((listener) => listener.remove()));
  }, [navigate]);

  return null;
};

export default AppBackButton;
