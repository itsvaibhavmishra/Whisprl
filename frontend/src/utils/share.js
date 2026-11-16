import { Share } from "@capacitor/share";

import { hasNative } from "@/utils/nativeFeatures";
import { notify } from "@/utils/notify";

// Android's web view has no share sheet, so the app asks Android for one, and one built before the plugin copies
export const canShareNatively = () => hasNative("Share") || (Boolean(navigator.share) && window.matchMedia("(pointer: coarse)").matches);

// closing the sheet without picking anywhere rejects, which is no error
export const shareLink = async ({ title, text, url, copy = url, copied }) => {
  if (hasNative("Share")) return Share.share({ title, text, url, dialogTitle: title }).catch(() => {});
  if (canShareNatively()) return navigator.share({ title, text, url }).catch(() => {});
  await navigator.clipboard.writeText(copy);
  notify({ severity: "success", message: copied });
};
