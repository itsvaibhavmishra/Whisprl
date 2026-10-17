import { useEffect, useState } from "react";

// the server decides, but waiting for it to answer makes a tap feel broken, so the screen shows the intent until it catches up
const usePending = (confirmed, send) => {
  const [wanted, setWanted] = useState(null);

  useEffect(() => {
    setWanted((pending) => (pending === confirmed ? null : pending));
  }, [confirmed]);

  const choose = async (next) => {
    setWanted(next);
    const result = await send(next);
    if (result?.meta?.requestStatus === "rejected") setWanted(null);
  };

  return [wanted ?? confirmed, choose];
};

export default usePending;
