import { useEffect, useState } from "react";

// the server decides, but waiting for it to answer makes the tick feel broken, so the seat shows the intent until it catches up
const usePendingReady = (isReady, send) => {
  const [wanted, setWanted] = useState(null);

  useEffect(() => {
    setWanted((pending) => (pending === isReady ? null : pending));
  }, [isReady]);

  const shown = wanted ?? isReady;

  const toggle = async () => {
    const next = !shown;
    setWanted(next);
    const result = await send(next);
    if (result?.meta?.requestStatus === "rejected") setWanted(null);
  };

  return [shown, toggle];
};

export default usePendingReady;
