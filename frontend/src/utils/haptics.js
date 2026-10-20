import { registerPlugin } from "@capacitor/core";

import { SETTINGS_STORAGE_KEY } from "@/config";
import { isApp } from "@/utils/platform";

const Haptics = registerPlugin("Haptics");

export const TAP = "tap";
export const PRESS = "press";
export const TICK = "tick";
export const CONFIRM = "confirm";
export const REJECT = "reject";

const hapticsOn = () => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY))?.haptics !== false;
  } catch {
    return true;
  }
};

export const feel = (kind = TAP) => {
  if (isApp && hapticsOn()) Haptics.feel({ kind }).catch(() => {});
};
