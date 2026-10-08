import { useEffect, useState } from "react";
import { Box, ButtonBase, IconButton, InputBase, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Archive, ArrowLeft, CaretRight, MagnifyingGlass, UsersThree, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import WhisprlAvatar from "@/assets/icons/logo/WhisprlAvatar.webp";
import RequestButton from "@/components/profile/RequestButton";
import Wordmark from "@/components/Wordmark";
import useIsLoading from "@/hooks/useIsLoading";
import { CreateOpenConversation, GetConversations } from "@/redux/slices/actions/chatActions";
import { SearchForUsers } from "@/redux/slices/actions/contactActions";
import { SearchFriends } from "@/redux/slices/actions/userActions";
import { clearSearchUsers } from "@/redux/slices/contactSlice";
import { clearSearch } from "@/redux/slices/userSlice";
import ChatAvatar from "@/sections/chat/ChatAvatar";
import ChatRow from "@/sections/chat/list/ChatRow";
import { identityOf, isDeleted, peerOf } from "@/utils/chats";

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
  <Typography component="h2" sx={{ px: 1.5, pt: 2.5, pb: 0.75, fontSize: 13, fontWeight: 700, color: "text.secondary" }}>
    {children}
  </Typography>
);

const PersonSummary = ({ person, name, detail }) => (
  <>
    <ChatAvatar src={person.avatar} name={person.firstName} size={44} />
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography noWrap sx={{ fontSize: 15, fontWeight: 700 }}>
        {name}
      </Typography>
      <Typography noWrap component="p" sx={{ m: 0, fontSize: 13, fontWeight: 500, color: "text.secondary" }}>
        {detail}
      </Typography>
    </Box>
  </>
);

const atUsername = (person) => (person.username ? `@${person.username}` : "");

const FriendRow = ({ person, isMe }) => {
  const dispatch = useDispatch();
  const fullName = `${person.firstName} ${person.lastName}`;

  return (
    <Box component="li" sx={{ listStyle: "none" }}>
      <ButtonBase
        onClick={() => dispatch(CreateOpenConversation(person._id))}
        sx={{ width: "100%", gap: 1.5, px: 1.25, py: 1, borderRadius: 3, justifyContent: "flex-start", textAlign: "left", "&:hover": { bgcolor: "action.hover" } }}
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

const StrangerRow = ({ person }) => (
  <Box component="li" sx={{ listStyle: "none", display: "flex", alignItems: "center", gap: 1.5, px: 1.25, py: 1 }}>
    <PersonSummary person={person} name={`${person.firstName} ${person.lastName}`} detail={atUsername(person)} />
    <RequestButton person={person} size="small" sx={{ borderRadius: 99, flexShrink: 0 }} />
  </Box>
);

const ChatList = ({ onNewGroup }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const friendMatches = useSelector((state) => state.user.searchResults);
  const strangerMatches = useSelector((state) => state.contact.searchedUsersList);
  const conversations = useSelector((state) => state.chat.conversations);
  const activeId = useSelector((state) => state.chat.activeConversation?._id);
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
    conversation._id === activeId ||
    (!isDeleted(conversation) && Boolean(conversation.latestMessage || conversation.clearedAt));
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
  const isUnfiltered = !needle && !isShowingArchived && filter === "all" && !archivedCount;

  return (
    <Stack component="nav" aria-label="Chats" sx={{ height: "100%", bgcolor: "chat.list" }}>
      <Stack spacing={1.75} sx={{ px: 2, pt: 1.25, pb: 1.25 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ minHeight: 44 }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {isShowingArchived && (
              <IconButton aria-label="Back to chats" onClick={() => setIsShowingArchived(false)} sx={{ ml: -1 }}>
                <ArrowLeft size={22} />
              </IconButton>
            )}
            <Typography component="h1" sx={{ m: 0 }}>
              <Wordmark name={isShowingArchived ? "Archived" : "Chats"} fontSize={30} />
            </Typography>
          </Stack>
          <Tooltip title="New group">
            <IconButton
              aria-label="New group"
              onClick={onNewGroup}
              sx={{ width: 40, height: 40, color: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), "&:hover": { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.18) } }}
            >
              <UsersThree size={20} weight="bold" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            height: 42,
            px: 1.5,
            borderRadius: 99,
            bgcolor: "chat.field",
            color: "text.secondary",
            border: 1.5,
            borderColor: "transparent",
            transition: "border-color 160ms ease, background-color 160ms ease",
            "&:focus-within": { borderColor: "primary.main", bgcolor: "chat.list" },
          }}
        >
          <MagnifyingGlass size={18} weight="bold" />
          <InputBase
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats and people"
            inputProps={{ "aria-label": "Search chats and people" }}
            sx={{ flex: 1, fontSize: 14, fontWeight: 500, color: "text.primary" }}
          />
          {query && (
            <IconButton size="small" aria-label="Clear search" onClick={() => setQuery("")} sx={{ mr: -0.75 }}>
              <X size={14} weight="bold" />
            </IconButton>
          )}
        </Stack>

        {!isShowingArchived && (
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" role="group" aria-label="Show">
            {Object.entries(FILTERS).map(([value, { label }]) => {
              const isOn = filter === value;
              return (
                <ButtonBase
                  key={value}
                  onClick={() => setFilter(value)}
                  aria-pressed={isOn}
                  sx={(theme) => {
                    // a solid chip would be the brightest thing on a dark screen, so at night the chosen one is only tinted
                    const isNight = theme.palette.mode === "dark";
                    const onColor = isNight ? theme.palette.primary.light : theme.palette.primary.contrastText;
                    return {
                      height: 32,
                      px: 1.5,
                      gap: 0.75,
                      borderRadius: 99,
                      fontSize: 13,
                      fontWeight: 700,
                      color: isOn ? onColor : theme.palette.text.secondary,
                      bgcolor: isOn ? (isNight ? alpha(theme.palette.primary.main, 0.16) : theme.palette.primary.main) : theme.palette.chat.field,
                      boxShadow: isOn && isNight ? `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.32)}` : "none",
                      transition: "background-color 160ms ease, color 160ms ease",
                      "&:hover": { color: isOn ? onColor : theme.palette.text.primary },
                    };
                  }}
                >
                  {label}
                  {value === "unread" && unreadChats > 0 && (
                    <Box component="span" sx={{ fontSize: 11, fontWeight: 800, opacity: isOn ? 0.85 : 1, color: isOn ? "inherit" : "primary.main" }}>
                      {unreadChats}
                    </Box>
                  )}
                </ButtonBase>
              );
            })}
          </Stack>
        )}
      </Stack>

      <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 2 }}>
        {isLoading && !conversations.length ? (
          <Stack spacing={0.5} sx={{ px: 1.25, pt: 1 }}>
            {[...Array(7).keys()].map((index) => (
              <Stack key={index} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1 }}>
                <Skeleton variant="circular" width={50} height={50} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width={`${50 + ((index * 13) % 30)}%`} sx={{ borderRadius: 2 }} />
                  <Skeleton width={`${70 + ((index * 7) % 25)}%`} sx={{ borderRadius: 2 }} />
                </Box>
              </Stack>
            ))}
          </Stack>
        ) : (
          <>
            {!isShowingArchived && !needle && archivedCount > 0 && (
              <ButtonBase
                onClick={() => setIsShowingArchived(true)}
                sx={{ width: "100%", gap: 1.5, px: 1.25, py: 1, borderRadius: 3, justifyContent: "flex-start", "&:hover": { bgcolor: "action.hover" } }}
              >
                <Box sx={{ width: 50, height: 50, borderRadius: "50%", display: "grid", placeItems: "center", color: "text.secondary", bgcolor: "chat.field" }}>
                  <Archive size={22} />
                </Box>
                <Typography sx={{ flex: 1, textAlign: "left", fontSize: 15, fontWeight: 700 }}>Archived</Typography>
                <Typography component="span" sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary" }}>
                  {archivedCount}
                </Typography>
                <CaretRight size={16} weight="bold" />
              </ButtonBase>
            )}
            {shown.length > 0 && (
              <Box component="ul" sx={{ m: 0, p: 0 }}>
                {shown.map((conversation) => (
                  <ChatRow key={conversation._id} conversation={conversation} isActive={conversation._id === activeId} hasChatOpen={Boolean(activeId)} />
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
              <Stack alignItems="center" spacing={1.5} sx={{ px: 3, py: 6, textAlign: "center" }}>
                {isUnfiltered && <Box component="img" src={WhisprlAvatar} alt="" sx={{ width: 96, height: 96, borderRadius: "50%", bgcolor: "chat.field" }} />}
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary", maxWidth: 260 }}>{note}</Typography>
              </Stack>
            )}
          </>
        )}
      </Box>
    </Stack>
  );
};

export default ChatList;
