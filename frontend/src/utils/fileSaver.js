import { registerPlugin } from "@capacitor/core";

import { notify } from "@/utils/notify";

const FileSaver = registerPlugin("FileSaver");

const PLACES = { Pictures: "your gallery", Movies: "your gallery", Download: "Downloads" };

const base64Of = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.slice(reader.result.indexOf(",") + 1));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// the app's web view ignores a download link, so Android is handed the file to put away itself
export const saveToPhone = async (blob, fileName, kind) => {
  const { folder } = await FileSaver.save({ data: await base64Of(blob), fileName, kind, mimeType: blob.type || "application/octet-stream" });
  notify({ severity: "success", message: `Saved to ${PLACES[folder]}` });
};
