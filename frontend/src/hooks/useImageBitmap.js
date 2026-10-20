import { useEffect, useState } from "react";

import { LONG_EDGE } from "@/utils/attachments";

// no larger than a photo is sent, so a camera photo does not slow every redraw while it is edited
const decodedWithin = async (file) => {
  const image = await createImageBitmap(file);
  const scale = LONG_EDGE / Math.max(image.width, image.height);
  if (scale >= 1) return image;
  const scaled = await createImageBitmap(image, { resizeWidth: Math.round(image.width * scale), resizeHeight: Math.round(image.height * scale), resizeQuality: "high" });
  image.close();
  return scaled;
};

const useImageBitmap = (file) => {
  const [bitmap, setBitmap] = useState(null);

  useEffect(() => {
    if (!file) return undefined;
    let decoded = null;
    let isCurrent = true;
    decodedWithin(file)
      .then((image) => {
        decoded = image;
        if (isCurrent) setBitmap(image);
        else image.close();
      })
      .catch(() => {});
    return () => {
      isCurrent = false;
      decoded?.close();
      setBitmap(null);
    };
  }, [file]);

  return bitmap;
};

export default useImageBitmap;
