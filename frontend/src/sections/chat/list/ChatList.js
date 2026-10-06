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
import { Archive, ArrowLeft, MagnifyingGlass, UsersThree, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { CreateOpenConversation, GetConversations } from "@/redux/slices/actions/chatActions";
import { SearchForUsers, SendRequest } from "@/redux/slices/actions/contactActions";
import { SearchFriends } from "@/redux/slices/actions/userActions";
import { clearSearchUsers } from "@/redux/slices/contactSlice";
import { clearSearch } from "@/redux/slices/userSlice";
import ChatRow from "@/sections/chat/list/ChatRow";
import { identityOf, peerOf } from "@/utils/chats";
import getAvatar from "@/utils/createAvatar";

const SEARCH_PAUSE_MS = 400;

const FILTERS = {
  all: { label: "All", keeps: () => true },
  unread: { label: "Unread", keeps: (conversation) => (conversation.unread ?? 0) > 0 },
  favourites: { label: "Favourites", keeps: (conversation) => Boolean(conversation.isFavourite) },
  groups: { label: "Groups", keeps: (conversation) => conversation.isGroup },
};

// a direct chat also answers to the other person's username, typed with or without its @
const matchesSearch = (conversation, meId, needle) => {
  const { name, peer } = identityOf(conversation, meId);
  const username = needle.replace(/^@/, "");
  return name.toLowerCase().includes(needle) || Boolean(username && peer?.username?.includes(username));
};

const SectionLabel = ({ children }) => (
  <Typography variant="subtitle2" component="h2" sx={{ px: 1.5, pt: 2, pb: 0.5, color: "text.secondary" }}>
    {children}
  </Typography>
);

const PersonSummary = ({ person, name, detail }) => {
  const theme = useTheme();
  return (
    <>
      {getAvatar(person.avatar, person.firstName, theme, 40)}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="subtitle2" noWrap>
          {name}
        </Typography>
        <Typography variant="caption" noWrap component="p" sx={{ m: 0, color: "text.secondary" }}>
          {detail}
        </Typography>
      </Box>
    </>
  );
};

const atUsername = (person) => (person.username ? `@${person.username}` : "");

const FriendRow = ({ person, isMe }) => {
  const dispatch = useDispatch();
  const fullName = `${person.firstName} ${person.lastName}`;

  return (
    <Box component="li" sx={{ listStyle: "none" }}>
      <ButtonBase
        onClick={() => dispatch(CreateOpenConversation(person._id))}
        sx={{ width: "100%", gap: 1.5, px: 1.5, py: 1, borderRadius: 2, justifyContent: "flex-start", textAlign: "left", "&:hover": { bgcolor: "action.hover" } }}
      >
        <PersonSummary
          person={person}
          name={isMe ? `${fullName} (You)` : fullName}
          detail={isMe ? "Message yourself" : atUsername(person) || "Start a chat"}
        />
      </ButtonBase>
    </Box>
  );
};

const StrangerRow = ({ person }) => {
  const dispatch = useDispatch();
  const sentRequests = useSelector((state) => state.contact.sentRequests);
  const isRequestSent = sentRequests.find((sent) => sent.receiverId === person._id)?.isSent ?? person.requestSent;

  return (
    <Box component="li" sx={{ listStyle: "none", display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1 }}>
      <PersonSummary person={person} name={`${person.firstName} ${person.lastName}`} detail={atUsername(person)} />
      <Button size="small" variant="outlined" disabled={isRequestSent} onClick={() => dispatch(SendRequest(person._id))}>
        {isRequestSent ? "Request sent" : "Add friend"}
      </Button>
    </Box>
  );
};

const ChatList = ({ onNewGroup }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const friendMatches = useSelector((state) => state.user.searchResults);
  const strangerMatches = useSelector((state) => state.contact.searchedUsersList);
  const { conversations, activeConversation } = useSelector((state) => state.chat);
  const isLoading = useIsLoading(GetConversations);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [isShowingArchived, setIsShowingArchived] = useState(false);

  const needle = query.trim().toLowerCase();

  useEffect(() => {
    if (!needle) {
      dispatch(clearSearch());
      dispatch(clearSearchUsers());
      return;
    }
    const timer = setTimeout(() => {
      dispatch(SearchFriends({ keyword: needle, page: 0 }));
      dispatch(SearchForUsers({ keyword: needle, page: 0 }));
    }, SEARCH_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [dispatch, needle]);

  // a cleared chat keeps its place, empty, as it would anywhere else
  const isListed = (conversation) =>
    conversation.latestMessage || conversation.clearedAt || conversation._id === activeConversation?._id;
  // a search looks through archived chats too
  const isInView = (conversation) => Boolean(needle) || Boolean(conversation.isArchived) === isShowingArchived;
  const activeFilter = isShowingArchived ? "all" : filter;

  const shown = conversations
    .filter(isListed)
    .filter(isInView)
    .filter(FILTERS[activeFilter].keeps)
    .filter((conversation) => matchesSearch(conversation, meId, needle));
  const archivedCount = conversations.filter((conversation) => conversation.isArchived && isListed(conversation)).length;

  // a friend whose chat is already listed above shows only as that chat
  const listedPeers = new Set(shown.filter((conversation) => !conversation.isGroup).map((conversation) => peerOf(conversation, meId)._id));
  const people = needle ? (friendMatches ?? []).filter((person) => !listedPeers.has(person._id)) : [];
  const strangers = needle ? (strangerMatches ?? []) : [];
  const unreadChats = conversations.filter((conversation) => !conversation.isArchived).filter(FILTERS.unread.keeps).length;

  const emptyNote = () => {
    if (needle) return `No chats or people match "${query.trim()}".`;
    if (isShowingArchived) return "No archived chats.";
    if (archivedCount && filter === "all") return null;
    if (filter === "favourites") return "No favourites yet. Add one from a chat's details.";
    if (filter === "unread") return "You're all caught up.";
    if (filter === "groups") return "No groups yet. Start one with New group.";
    return "No chats yet. Find a friend in Contacts, or start a group.";
  };

  const note = emptyNote();

  return (
    <Stack component="nav" aria-label="Chats" sx={{ height: "100%", bgcolor: "background.default" }}>
      <Stack spacing={2} sx={{ px: 2.5, pt: 3, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {isShowingArchived && (
              <IconButton aria-label="Back to chats" onClick={() => setIsShowingArchived(false)} sx={{ ml: -1 }}>
                <ArrowLeft size={22} />
              </IconButton>
            )}
            <Typography component="h1" sx={{ m: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>
              {isShowingArchived ? "Archived" : "Chats"}
            </Typography>
          </Stack>
          <Button size="small" startIcon={<UsersThree size={18} />} onClick={onNewGroup}>
            New group
          </Button>
        </Stack>

        <TextField
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search chats and people"
          inputProps={{ "aria-label": "Search chats and people" }}
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

        {!isShowingArchived && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" role="group" aria-label="Show">
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
        )}
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
            {!isShowingArchived && !needle && archivedCount > 0 && (
              <ButtonBase
                onClick={() => setIsShowingArchived(true)}
                sx={{ width: "100%", gap: 1.5, px: 1.5, py: 1.25, borderRadius: 2, justifyContent: "flex-start", "&:hover": { bgcolor: "action.hover" } }}
              >
                <Box sx={{ width: 48, display: "grid", placeItems: "center", color: "text.secondary" }}>
                  <Archive size={22} />
                </Box>
                <Typography variant="subtitle2" sx={{ flex: 1, textAlign: "left" }}>
                  Archived
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                  {archivedCount}
                </Typography>
              </ButtonBase>
            )}
            {shown.length > 0 && (
              <Box component="ul" sx={{ m: 0, p: 0 }}>
                {shown.map((conversation) => (
                  <ChatRow key={conversation._id} conversation={conversation} isActive={conversation._id === activeConversation?._id} />
                ))}
              </Box>
            )}
            {people.length > 0 && (
              <>
                <SectionLabel>Friends</SectionLabel>
                <Box component="ul" sx={{ m: 0, p: 0 }}>
                  {people.map((person) => (
                    <FriendRow key={person._id} person={person} isMe={person._id === meId} />
                  ))}
                </Box>
              </>
            )}
            {strangers.length > 0 && (
              <>
                <SectionLabel>More people</SectionLabel>
                <Box component="ul" sx={{ m: 0, p: 0 }}>
                  {strangers.map((person) => (
                    <StrangerRow key={person._id} person={person} />
                  ))}
                </Box>
              </>
            )}
            {!shown.length && !people.length && !strangers.length && note && (
              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", px: 3, py: 6 }}>
                {note}
              </Typography>
            )}
          </>
        )}
      </Box>
    </Stack>
  );
};

export default ChatList;
