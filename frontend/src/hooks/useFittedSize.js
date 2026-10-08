import { useCallback, useRef, useState } from "react";

const fitted = ({ width, height }, aspect) =>
  width / height > aspect ? { width: Math.floor(height * aspect), height: Math.floor(height) } : { width: Math.floor(width), height: Math.floor(width / aspect) };

// the ref callback alone owns the observer, since a strict-mode effect cleanup would disconnect it before its first report
const useFittedSize = (aspect) => {
  const [area, setArea] = useState(null);
  const observer = useRef(null);

  const ref = useCallback((node) => {
    observer.current?.disconnect();
    if (!node) return;
    observer.current = new ResizeObserver(([entry]) => setArea(entry.contentRect));
    observer.current.observe(node);
  }, []);

  return [ref, area?.width > 0 && area.height > 0 ? fitted(area, aspect) : null];
};

export default useFittedSize;
