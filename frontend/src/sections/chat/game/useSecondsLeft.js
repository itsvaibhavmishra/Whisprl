import { useEffect, useState } from "react";

const TICK = 250;

const useSecondsLeft = (until) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!until) return undefined;
    const timer = setInterval(() => setTick((tick) => tick + 1), TICK);
    return () => clearInterval(timer);
  }, [until]);

  if (!until) return null;
  // read now rather than at the last tick, or the first frame of a new deadline counts from a stale clock
  const secondsLeft = Math.ceil((new Date(until).getTime() - Date.now()) / 1000);
  return secondsLeft > 0 ? secondsLeft : null;
};

export default useSecondsLeft;
