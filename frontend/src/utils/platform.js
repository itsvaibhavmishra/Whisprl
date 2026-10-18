import { Capacitor } from "@capacitor/core";

export const isApp = Capacitor.isNativePlatform();

// on the web every browser keeps its own keys, in the app the device does
export const deviceNoun = isApp ? "device" : "browser";
