import { useEffect, useState } from "react";

// true once the image has loaded, or failed, so what shows it opens whole instead of filling in
const useImageReady = (src) => {
  const [readySrc, setReadySrc] = useState(null);

  useEffect(() => {
    if (!src) return undefined;
    const image = new Image();
    image.onload = () => setReadySrc(src);
    image.onerror = () => setReadySrc(src);
    image.src = src;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [src]);

  return Boolean(src) && readySrc === src;
};

export default useImageReady;
