import { Capacitor } from "@capacitor/core";

export const isApp = Capacitor.isNativePlatform();

// the website can only tell an Android phone by its browser
export const isAndroidBrowser = !isApp && /android/i.test(navigator.userAgent);

// on the web every browser keeps its own keys, in the app the device does
export const deviceNoun = isApp ? "device" : "browser";
