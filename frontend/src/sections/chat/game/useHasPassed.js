import { useEffect, useState } from "react";

// whether a moment has come, rendering once when it does instead of on a tick
const useHasPassed = (moment) => {
  const at = moment ? new Date(moment).getTime() : 0;
  const [, setReached] = useState(null);

  useEffect(() => {
    const wait = at - Date.now();
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setReached(at), wait + 1);
    return () => clearTimeout(timer);
  }, [at]);

  // read now, so a new moment never counts as passed because the last one had
  return Date.now() >= at;
};

export default useHasPassed;
