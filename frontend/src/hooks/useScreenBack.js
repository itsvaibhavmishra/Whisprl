import { useEffect, useRef } from "react";

import { addScreenBack } from "@/utils/appBack";
import { isApp } from "@/utils/platform";

const useScreenBack = (onBack) => {
  const latest = useRef(onBack);
  const hasBack = Boolean(onBack);

  useEffect(() => {
    latest.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!isApp || !hasBack) return undefined;
    return addScreenBack(() => latest.current?.());
  }, [hasBack]);
};

export default useScreenBack;
