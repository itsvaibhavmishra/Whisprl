import { useEffect } from "react";

import { addBackPreview } from "@/utils/appBack";
import { isApp } from "@/utils/platform";

const useBackPreview = (canPreview) => {
  useEffect(() => {
    if (!isApp || !canPreview) return undefined;
    return addBackPreview();
  }, [canPreview]);
};

export default useBackPreview;
