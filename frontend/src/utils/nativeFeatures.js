import { Capacitor } from "@capacitor/core";

import { isApp } from "@/utils/platform";

// a live update can reach an app built before a plugin existed, so code that needs one asks first and falls back
export const hasNative = (plugin) => isApp && Capacitor.isPluginAvailable(plugin);
