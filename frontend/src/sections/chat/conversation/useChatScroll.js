import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const NEAR_BOTTOM = 120;
const OPEN_AT_MARGIN = 16;
const LOAD_OLDER_AHEAD = "400px 0px 0px 0px";

const topWithin = (container, node) => node.getBoundingClientRect().top - container.getBoundingClientRect().top;

const nodeFor = (container, key) => container.querySelector(`[data-message-key="${CSS.escape(key)}"]`);

const firstVisibleBubble = (container) =>
  [...container.querySelectorAll("[data-message-key]")].find((node) => topWithin(container, node) + node.offsetHeight > 0);

// keeps the reader's place by hand as pages load above and photos grow, since Safari has no CSS scroll anchoring
export const useChatScroll = ({ conversationId, openAtKey, contentVersion, firstMessageId, canLoadOlder, onLoadOlder }) => {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const topRef = useRef(null);
  const isAtBottom = useRef(true);
  const anchor = useRef(null);
  const holdAnchor = useRef(false);
  const openAt = useRef(null);
  openAt.current = openAtKey;
  const hasOpened = useRef(false);
  const [isAwayFromBottom, setIsAwayFromBottom] = useState(false);

  const measureBottom = useCallback(() => {
    const container = scrollRef.current;
    isAtBottom.current = container.scrollHeight - container.scrollTop - container.clientHeight < NEAR_BOTTOM;
    setIsAwayFromBottom(!isAtBottom.current);
  }, []);

  const rememberAnchor = useCallback(() => {
    const container = scrollRef.current;
    const node = container && firstVisibleBubble(container);
    anchor.current = node ? { key: node.dataset.messageKey, offset: topWithin(container, node) } : null;
  }, []);

  const restorePosition = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    // a chat with unread messages opens at the first of them rather than at the bottom
    const openingNode = !hasOpened.current && openAt.current && nodeFor(container, openAt.current);
    if (openingNode) {
      hasOpened.current = true;
      container.scrollTop += topWithin(container, openingNode) - OPEN_AT_MARGIN;
      measureBottom();
    } else if (isAtBottom.current && !holdAnchor.current) {
      container.scrollTop = container.scrollHeight;
    } else if (anchor.current) {
      const node = nodeFor(container, anchor.current.key);
      if (node) container.scrollTop += topWithin(container, node) - anchor.current.offset;
    }
    holdAnchor.current = false;
    rememberAnchor();
  }, [measureBottom, rememberAnchor]);

  const handleScroll = () => {
    measureBottom();
    rememberAnchor();
  };

  // tapping a message keeps that bubble still while its time and status open around it
  const holdStill = (key) => {
    const container = scrollRef.current;
    const node = container && nodeFor(container, key);
    if (!node) return;
    anchor.current = { key, offset: topWithin(container, node) };
    holdAnchor.current = true;
  };

  const jumpToLatest = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });

  useLayoutEffect(() => {
    isAtBottom.current = true;
    anchor.current = null;
    hasOpened.current = false;
    setIsAwayFromBottom(false);
  }, [conversationId]);

  useLayoutEffect(restorePosition, [conversationId, contentVersion, restorePosition]);

  useEffect(() => {
    const observer = new ResizeObserver(restorePosition);
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [restorePosition]);

  // observing afresh after every page means a short page that leaves the top in view asks for the next one
  useEffect(() => {
    if (!canLoadOlder || !topRef.current) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && onLoadOlder(), {
      root: scrollRef.current,
      rootMargin: LOAD_OLDER_AHEAD,
    });
    observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [conversationId, firstMessageId, canLoadOlder, onLoadOlder]);

  return { scrollRef, contentRef, topRef, handleScroll, holdStill, jumpToLatest, isAwayFromBottom };
};
