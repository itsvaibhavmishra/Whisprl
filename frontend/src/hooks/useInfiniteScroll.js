import { useEffect, useRef } from "react";

// the next page starts loading about a screen before the end of the list scrolls into view
const AHEAD = "0px 0px 600px 0px";

const scrollParentOf = (node) => {
  let parent = node.parentElement;
  while (parent && !/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) parent = parent.parentElement;
  return parent;
};

// returns a ref for a marker after the last row; a fresh observer reports at once, so a page that leaves the end in reach asks for the next
const useInfiniteScroll = (onReachEnd, { isActive, length }) => {
  const marker = useRef(null);
  const reachEnd = useRef(onReachEnd);

  useEffect(() => {
    reachEnd.current = onReachEnd;
  });

  useEffect(() => {
    const node = marker.current;
    if (!isActive || !node) return undefined;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && reachEnd.current(), { root: scrollParentOf(node), rootMargin: AHEAD });
    observer.observe(node);
    return () => observer.disconnect();
  }, [isActive, length]);

  return marker;
};

export default useInfiniteScroll;
