import { useEffect, useState } from "react";

const TICK = 250;

const secondsUntil = (until) => {
  const secondsLeft = Math.ceil((new Date(until).getTime() - Date.now()) / 1000);
  return secondsLeft > 0 ? secondsLeft : null;
};

// checked every quarter second for accuracy, but a check that finds the same second changes no state, so nothing re-renders
const useSecondsLeft = (until) => {
  const [, setShown] = useState(null);

  useEffect(() => {
    if (!until) return undefined;
    const timer = setInterval(() => setShown(secondsUntil(until)), TICK);
    return () => clearInterval(timer);
  }, [until]);

  // read now rather than at the last tick, or the first frame of a new deadline counts from a stale clock
  return until ? secondsUntil(until) : null;
};

export default useSecondsLeft;
