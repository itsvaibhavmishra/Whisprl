import { useEffect, useState } from "react";
import { CircularProgress, IconButton, InputBase, Stack, Tooltip, Typography } from "@mui/material";
import { CaretDown, CaretUp, MagnifyingGlass, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { HISTORY_LIMIT, LoadHistory } from "@/redux/slices/actions/messageActions";
import { focusMessage } from "@/redux/slices/chatSlice";
import { GLASS_BAR } from "@/sections/chat/conversation/ConversationHeader";
import { MATCH_HIGHLIGHT, MESSAGES_ID } from "@/sections/chat/conversation/ConversationMain";
import { withArrivals } from "@/utils/chats";

const SETTLE_MS = 300;

const rangesOf = (needle, root) => {
  const ranges = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent.toLowerCase();
    for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + needle.length)) {
      const range = new Range();
      range.setStart(node, at);
      range.setEnd(node, at + needle.length);
      ranges.push(range);
    }
  }
  return ranges;
};

// marks every match on screen through the browser's highlight registry, so no message re-renders as you type
const useMatchHighlight = (needle) => {
  useEffect(() => {
    const messages = document.getElementById(MESSAGES_ID);
    if (!window.CSS?.highlights || !needle || !messages) return undefined;
    const paint = () => {
      const texts = [...messages.querySelectorAll("[data-searchable]")];
      CSS.highlights.set(MATCH_HIGHLIGHT, new window.Highlight(...texts.flatMap((text) => rangesOf(needle, text))));
    };
    paint();
    const observer = new MutationObserver(paint);
    observer.observe(messages, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      CSS.highlights.delete(MATCH_HIGHLIGHT);
    };
  }, [needle]);
};

const searchableTextOf = (message) =>
  [message.message, message.contact && `${message.contact.firstName} ${message.contact.lastName}`, message.file?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const newestMatchesFor = (needle, messages) => {
  if (!needle) return [];
  return messages
    .filter((message) => !message.event && !message.deletedAt && searchableTextOf(message).includes(needle))
    .reverse();
};

const ChatSearchBar = ({ onClose }) => {
  const dispatch = useDispatch();
  const { activeConversation, messages, history } = useSelector((state) => state.chat);
  const isGathering = useIsLoading(LoadHistory);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState(0);
  const needle = query.trim().toLowerCase();

  useMatchHighlight(needle);

  const gathered = history[activeConversation._id];
  const matches = newestMatchesFor(needle, withArrivals(gathered, messages));

  useEffect(() => {
    dispatch(LoadHistory(activeConversation._id));
  }, [dispatch, activeConversation._id]);

  // a pause in typing jumps to the newest match, so the reader sees results without pressing anything
  const newestMatch = matches[0]?._id;
  useEffect(() => {
    setPosition(0);
    if (!newestMatch) return;
    const timer = setTimeout(() => dispatch(focusMessage(newestMatch)), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [needle, newestMatch, dispatch]);

  const step = (direction) => {
    if (!matches.length) return;
    const next = (position + direction + matches.length) % matches.length;
    setPosition(next);
    dispatch(focusMessage(matches[next]._id));
  };

  const status = () => {
    if (!needle) return gathered && !gathered.isComplete ? `Searching your latest ${HISTORY_LIMIT.toLocaleString()} messages` : "";
    if (isGathering && !matches.length) return "Searching";
    return matches.length ? `${position + 1} of ${matches.length}` : "No matches";
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      role="search"
      sx={{ ...GLASS_BAR, px: { xs: 1.5, md: 2.5 }, py: 0.75 }}
    >
      <MagnifyingGlass size={18} aria-hidden />
      <InputBase
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") step(event.shiftKey ? -1 : 1);
          if (event.key === "Escape") onClose();
        }}
        placeholder="Search this chat"
        inputProps={{ "aria-label": "Search this chat" }}
        sx={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 500 }}
      />
      {isGathering && <CircularProgress size={14} aria-label="Gathering messages" />}
      <Typography variant="caption" role="status" sx={{ color: "text.secondary", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
        {status()}
      </Typography>
      <Tooltip title="Newer match">
        <span>
          <IconButton size="small" aria-label="Newer match" onClick={() => step(-1)} disabled={matches.length < 2}>
            <CaretUp size={16} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Older match">
        <span>
          <IconButton size="small" aria-label="Older match" onClick={() => step(1)} disabled={matches.length < 2}>
            <CaretDown size={16} />
          </IconButton>
        </span>
      </Tooltip>
      <IconButton size="small" aria-label="Close search" onClick={onClose}>
        <X size={16} />
      </IconButton>
    </Stack>
  );
};

export default ChatSearchBar;
