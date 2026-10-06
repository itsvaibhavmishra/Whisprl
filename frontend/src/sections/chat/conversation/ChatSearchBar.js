import { useEffect, useState } from "react";
import { CircularProgress, IconButton, InputBase, Stack, Tooltip, Typography } from "@mui/material";
import { CaretDown, CaretUp, MagnifyingGlass, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { HISTORY_LIMIT, LoadHistory } from "@/redux/slices/actions/messageActions";
import { focusMessage } from "@/redux/slices/chatSlice";
import { withArrivals } from "@/utils/chats";

const SETTLE_MS = 300;

const searchableTextOf = (message) =>
  [message.message, message.contact && `${message.contact.firstName} ${message.contact.lastName}`, message.file?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const newestMatchesFor = (query, messages) => {
  const needle = query.trim().toLowerCase();
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

  const gathered = history[activeConversation._id];
  const matches = newestMatchesFor(query, withArrivals(gathered, messages));

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
  }, [query, newestMatch, dispatch]);

  const step = (direction) => {
    if (!matches.length) return;
    const next = (position + direction + matches.length) % matches.length;
    setPosition(next);
    dispatch(focusMessage(matches[next]._id));
  };

  const status = () => {
    if (!query.trim()) return gathered && !gathered.isComplete ? `Searching your latest ${HISTORY_LIMIT.toLocaleString()} messages` : "";
    if (isGathering && !matches.length) return "Searching";
    return matches.length ? `${position + 1} of ${matches.length}` : "No matches";
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      role="search"
      sx={{ px: { xs: 1.5, md: 2.5 }, py: 0.75, bgcolor: "background.default", borderBottom: 1, borderColor: "divider" }}
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
        sx={{ flex: 1, minWidth: 0 }}
      />
      {isGathering && <CircularProgress size={14} aria-label="Gathering messages" />}
      <Typography variant="caption" role="status" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
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
