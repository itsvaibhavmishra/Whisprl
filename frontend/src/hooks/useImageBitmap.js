import { useEffect, useState } from "react";

const useImageBitmap = (file) => {
  const [bitmap, setBitmap] = useState(null);

  useEffect(() => {
    if (!file) return undefined;
    let decoded = null;
    let isCurrent = true;
    createImageBitmap(file)
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
