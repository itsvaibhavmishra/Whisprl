import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useDispatch } from "react-redux";

import { CheckForAppUpdate } from "@/redux/slices/actions/appUpdateActions";
import { playProgressed } from "@/redux/slices/appUpdateSlice";
import { hasNative } from "@/utils/nativeFeatures";
import { isApp } from "@/utils/platform";
import { onPlayProgress } from "@/utils/playUpdate";

const CHECK_EVERY_MS = 30 * 60 * 1000;

// asked on opening and on coming back, at most every half hour, while Play reports a download as it happens
const useAppUpdates = (isSignedIn) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isApp || !isSignedIn) return undefined;
    let checkedAt = 0;
    const check = () => {
      if (Date.now() - checkedAt < CHECK_EVERY_MS) return;
      checkedAt = Date.now();
      dispatch(CheckForAppUpdate());
    };

    check();
    const listeners = [App.addListener("resume", check)];
    if (hasNative("PlayUpdate")) listeners.push(onPlayProgress((event) => dispatch(playProgressed(event))));
    return () => listeners.forEach((listener) => listener.then((handle) => handle.remove()));
  }, [dispatch, isSignedIn]);
};

export default useAppUpdates;
