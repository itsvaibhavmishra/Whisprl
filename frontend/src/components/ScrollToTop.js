import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// A route change keeps the previous page's scroll position unless something resets it.
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
