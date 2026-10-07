import { useEffect, useRef, useState } from "react";

import { openedFileUrl, ownUrlOf } from "@/utils/attachments";

const useFileUrl = (file) => {
  const ownUrl = ownUrlOf(file);
  const sealed = useRef(file.sealed);
  sealed.current = file.sealed;
  const sealedUrl = file.sealed?.url;
  const [opened, setOpened] = useState({ url: null, failed: false });

  useEffect(() => {
    if (ownUrl || !sealedUrl) return undefined;
    let isCurrent = true;
    openedFileUrl(sealed.current).then(
      (url) => isCurrent && setOpened({ url, failed: false }),
      () => isCurrent && setOpened({ url: null, failed: true })
    );
    return () => {
      isCurrent = false;
    };
  }, [ownUrl, sealedUrl]);

  return { url: ownUrl || opened.url, failed: opened.failed };
};

export default useFileUrl;
