import { SystemBars, SystemBarsStyle } from "@capacitor/core";

import { isApp } from "@/utils/platform";

let appStyle = SystemBarsStyle.Default;
let darkViewsOpen = 0;

const apply = () => {
  if (!isApp) return;
  SystemBars.setStyle({ style: darkViewsOpen ? SystemBarsStyle.Dark : appStyle }).catch(() => {});
};

// the phone colours its bar icons for its own mode, which can differ from the mode chosen in Whisprl
export const matchSystemBars = (isLight) => {
  appStyle = isLight ? SystemBarsStyle.Light : SystemBarsStyle.Dark;
  apply();
};

// a view that is dark in either mode, like the photo editor, keeps light icons while it is open
export const holdDarkSystemBars = () => {
  darkViewsOpen += 1;
  apply();
  return () => {
    darkViewsOpen -= 1;
    apply();
  };
};
