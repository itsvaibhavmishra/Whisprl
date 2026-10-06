import { useEffect, useState } from "react";
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { MagnifyingGlass, UsersThree, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { CreateOpenConversation, GetConversations } from "@/redux/slices/actions/chatActions";
import { SearchFriends } from "@/redux/slices/actions/userActions";
import { clearSearch } from "@/redux/slices/userSlice";
import ChatRow from "@/sections/chat/list/ChatRow";
import { identityOf, peerOf } from "@/utils/chats";
import getAvatar from "@/utils/createAvatar";

const SEARCH_PAUSE_MS = 400;

const FILTERS = {
  all: { label: "All", keeps: () => true },
  unread: { label: "Unread", keeps: (conversation) => (conversation.unread ?? 0) > 0 },
  groups: { label: "Groups", keeps: (conversation) => conversation.isGroup },
};

const SectionLabel = ({ children }) => (
  <Typography variant="subtitle2" component="h2" sx={{ px: 1.5, pt: 2, pb: 0.5, color: "text.secondary" }}>
    {children}
  </Typography>
);

const PersonRow = ({ person, isMe }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  return (
    <Box component="li" sx={{ listStyle: "none" }}>
      <ButtonBase
        onClick={() => dispatch(CreateOpenConversation(person._id))}
        sx={{ width: "100%", gap: 1.5, px: 1.5, py: 1, borderRadius: 2, justifyContent: "flex-start", textAlign: "left", "&:hover": { bgcolor: "action.hover" } }}
      >
        {getAvatar(person.avatar, person.firstName, theme, 40)}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>{`${person.firstName} ${person.lastName}${isMe ? " (You)" : ""}`}</Typography>
          <Typography variant="caption" noWrap component="p" sx={{ m: 0, color: "text.secondary" }}>
            {isMe ? "Message yourself" : "Start a chat"}
          </Typography>
        </Box>
      </ButtonBase>
    </Box>
  );
};

const ChatList = ({ onNewGroup }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const friendMatches = useSelector((state) => state.user.searchResults);
  const { conversations, activeConversation } = useSelector((state) => state.chat);
  const isLoading = useIsLoading(GetConversations);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const needle = query.trim().toLowerCase();

  useEffect(() => {
    if (!needle) {
      dispatch(clearSearch());
      return;
    }
    const timer = setTimeout(() => dispatch(SearchFriends({ keyword: needle, page: 0 })), SEARCH_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [dispatch, needle]);

  const shown = conversations
    .filter((conversation) => conversation.latestMessage || conversation._id === activeConversation?._id)
    .filter(FILTERS[filter].keeps)
    .filter((conversation) => identityOf(conversation, meId).name.toLowerCase().includes(needle));

  // a friend whose chat is already listed above shows only as that chat
  const listedPeers = new Set(shown.filter((conversation) => !conversation.isGroup).map((conversation) => peerOf(conversation, meId)._id));
  const people = needle ? (friendMatches ?? []).filter((person) => !listedPeers.has(person._id)) : [];
  const unreadChats = conversations.filter(FILTERS.unread.keeps).length;

  const emptyNote = () => {
    if (needle) return `No chats or friends match "${query.trim()}".`;
    if (filter === "unread") return "You're all caught up.";
    if (filter === "groups") return "No groups yet. Start one with New group.";
    return "No chats yet. Find a friend in Contacts, or start a group.";
  };

  return (
    <Stack component="nav" aria-label="Chats" sx={{ height: "100%", bgcolor: "background.default" }}>
      <Stack spacing={2} sx={{ px: 2.5, pt: 3, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography component="h1" sx={{ m: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Chats
          </Typography>
          <Button size="small" startIcon={<UsersThree size={18} />} onClick={onNewGroup}>
            New group
          </Button>
        </Stack>

        <TextField
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search chats and friends"
          inputProps={{ "aria-label": "Search chats and friends" }}
          InputProps={{
            sx: { borderRadius: 99, bgcolor: "background.paper", "& fieldset": { border: "none" } },
            startAdornment: (
              <InputAdornment position="start">
                <MagnifyingGlass size={18} />
              </InputAdornment>
            ),
            endAdornment: query && (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Clear search" onClick={() => setQuery("")}>
                  <X size={14} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={1} role="group" aria-label="Show">
          {Object.entries(FILTERS).map(([value, { label }]) => (
            <Chip
              key={value}
              label={value === "unread" && unreadChats ? `${label} ${unreadChats}` : label}
              onClick={() => setFilter(value)}
              color={filter === value ? "primary" : "default"}
              variant={filter === value ? "filled" : "outlined"}
              aria-pressed={filter === value}
              size="small"
            />
          ))}
        </Stack>
      </Stack>

      <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 2 }} className="scrollbar">
        {isLoading && !conversations.length ? (
          <Stack spacing={1} sx={{ px: 1.5, pt: 1 }}>
            {[...Array(6).keys()].map((index) => (
              <Stack key={index} direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.75 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="55%" />
                  <Skeleton width="80%" />
                </Box>
              </Stack>
            ))}
          </Stack>
        ) : (
          <>
            {shown.length > 0 && (
              <Box component="ul" sx={{ m: 0, p: 0 }}>
                {shown.map((conversation) => (
                  <ChatRow key={conversation._id} conversation={conversation} isActive={conversation._id === activeConversation?._id} />
                ))}
              </Box>
            )}
            {people.length > 0 && (
              <>
                <SectionLabel>People</SectionLabel>
                <Box component="ul" sx={{ m: 0, p: 0 }}>
                  {people.map((person) => (
                    <PersonRow key={person._id} person={person} isMe={person._id === meId} />
                  ))}
                </Box>
              </>
            )}
            {!shown.length && !people.length && (
              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", px: 3, py: 6 }}>
                {emptyNote()}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Stack>
  );
};

export default ChatList;
