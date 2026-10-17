import { useEffect, useState } from "react";

// a board that animates in before its artwork has decoded jumps, so the entrance waits for the files
const useArtReady = (sources) => {
  const key = sources.join("|");
  const [readyFor, setReadyFor] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    const load = (source) =>
      new Promise((resolve) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = resolve;
        image.src = source;
      });

    Promise.all(key.split("|").map(load)).then(() => {
      if (isCurrent) setReadyFor(key);
    });
    return () => {
      isCurrent = false;
    };
  }, [key]);

  return readyFor === key;
};

export default useArtReady;
