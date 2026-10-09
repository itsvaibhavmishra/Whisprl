import { useEffect, useState } from "react";
import { Box, Button, ButtonBase, IconButton, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CaretRight, HandWaving, UserPlus } from "phosphor-react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { PaneEmpty } from "@/components/Pane";
import { SOFT } from "@/components/profile/RelationshipActions";
import SearchPill from "@/components/SearchPill";
import Wordmark from "@/components/Wordmark";
import useHasSettled from "@/hooks/useHasSettled";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import useOpenChat from "@/hooks/useOpenChat";
import { GetRequests } from "@/redux/slices/actions/contactActions";
import { GetFriends } from "@/redux/slices/actions/userActions";
import { selectWaitingRequests } from "@/redux/slices/contactSlice";
import { FIND_PATH, REQUESTS_PATH, isAddressOf, useContactsAddress } from "@/sections/contacts/contactsRoute";
import PersonRow, { PersonSkeletons } from "@/sections/contacts/PersonRow";
import { birthdaysThisWeek, isBirthdayToday, whenLabel } from "@/utils/birthdays";
import { isOnline } from "@/utils/chats";
import { SPOKEN_ONLY } from "@/utils/spokenOnly";

const AVATAR_SIZE = 50;
// every friend is already here for the rest of the app, so the list shows them a page at a time rather than fetching pages
const ROWS_PER_PAGE = 20;

const byName = (one, other) => `${one.firstName} ${one.lastName}`.localeCompare(`${other.firstName} ${other.lastName}`);

// typed with or without its @, a search also finds a username
const matches = (needle) => (person) => {
  const handle = needle.replace(/^@/, "");
  return `${person.firstName} ${person.lastName}`.toLowerCase().includes(needle) || Boolean(handle && person.username?.includes(handle));
};

const namesOf = (people) => {
  const names = people.map((person) => person.firstName);
  if (names.length === 1) return `${names[0]} wants to connect`;
  if (names.length === 2) return `${names[0]} and ${names[1]} want to connect`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more want to connect`;
};

const SectionLabel = ({ label, count }) => (
  <Typography component="h2" sx={{ px: 1, pt: 2.5, pb: 0.75, fontSize: 13, fontWeight: 700, color: "text.secondary" }}>
    {label}
    {count > 0 && <Box component="span" sx={{ ml: 0.75, fontWeight: 500 }}>{count}</Box>}
  </Typography>
);

const RequestsRow = ({ isSelected, isWide }) => {
  const incoming = useSelector(selectWaitingRequests);
  const outgoing = useSelector((state) => state.contact.outgoing);
  const hasRequests = useHasSettled(GetRequests);
  const waiting = incoming.length;

  const detail = () => {
    if (!hasRequests) return <Skeleton width="60%" sx={{ borderRadius: 2 }} />;
    if (waiting) return namesOf(incoming.map((request) => request.person));
    if (outgoing.length) return outgoing.length === 1 ? "1 request sent" : `${outgoing.length} requests sent`;
    return "No one waiting";
  };

  return (
    <ButtonBase
      component={Link}
      to={REQUESTS_PATH}
      aria-current={isSelected ? "page" : undefined}
      sx={{
        width: "100%",
        gap: 1.5,
        px: 1,
        py: 1,
        borderRadius: 3,
        justifyContent: "flex-start",
        textAlign: "left",
        bgcolor: isSelected ? (theme) => alpha(theme.palette.primary.main, 0.12) : "transparent",
        "&:hover": { bgcolor: (theme) => alpha(theme.palette.primary.main, isSelected ? 0.16 : 0.06) },
        "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main", outlineOffset: -2 },
      }}
    >
      <Box sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, flexShrink: 0, borderRadius: "50%", display: "grid", placeItems: "center", color: "primary.main", bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12) }}>
        <HandWaving size={24} weight="duotone" />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: 15, fontWeight: waiting ? 800 : 700, letterSpacing: "-0.01em" }}>Requests</Typography>
        <Typography noWrap component="p" sx={{ m: 0, mt: 0.25, fontSize: 13, fontWeight: 500, color: "text.secondary" }}>
          {detail()}
        </Typography>
      </Box>
      {waiting > 0 && (
        <>
          <Box aria-hidden sx={{ minWidth: 22, height: 22, px: 0.75, borderRadius: 99, display: "grid", placeItems: "center", bgcolor: "primary.main", color: "primary.contrastText", fontSize: 12, fontWeight: 800 }}>
            {waiting}
          </Box>
          <Box component="span" sx={SPOKEN_ONLY}>{`, ${waiting} waiting`}</Box>
        </>
      )}
      {!isWide && <CaretRight size={16} weight="bold" />}
    </ButtonBase>
  );
};

const WishButton = ({ person }) => {
  const openChat = useOpenChat(person._id);
  return (
    <Button size="small" onClick={openChat} sx={{ ...SOFT, borderRadius: 99 }}>
      Wish them
    </Button>
  );
};

const BirthdaysThisWeek = ({ people, onlineFriends }) => (
  <>
    <SectionLabel label="Birthdays this week" count={people.length} />
    <Box component="ul" sx={{ m: 0, p: 0 }}>
      {people.map((person) => (
        <PersonRow
          key={person._id}
          person={person}
          isOnline={isOnline(person, onlineFriends)}
          detail={whenLabel(person.birthday)}
          action={isBirthdayToday(person.birthday) ? <WishButton person={person} /> : undefined}
        />
      ))}
    </Box>
  </>
);

// the list finds friends only, so a search that misses carries its words over to Find people, which looks through everyone
const NoFriendMatches = ({ query, onLeave }) => (
  <Stack alignItems="center" spacing={2} sx={{ px: 3, py: 5, textAlign: "center" }}>
    <Typography sx={{ maxWidth: 280, fontSize: 14, fontWeight: 500, color: "text.secondary" }}>{`No friends match "${query}".`}</Typography>
    <Button component={Link} to={`${FIND_PATH}?q=${encodeURIComponent(query)}`} state={{ focusSearch: true }} onClick={onLeave} variant="contained">
      Search everyone
    </Button>
  </Stack>
);

const ContactsList = ({ isWide }) => {
  const { isRequests, isFinding, handle } = useContactsAddress();
  const meId = useSelector((state) => state.user.user._id);
  const friends = useSelector((state) => state.user.friends);
  const onlineFriends = useSelector((state) => state.user.onlineFriends);
  const hasFriends = useHasSettled(GetFriends);
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  // everyone is their own friend on the server, so the list leaves you out
  const people = friends.filter((friend) => friend._id !== meId).sort(byName);
  const shownFriends = needle ? people.filter(matches(needle)) : people;
  const birthdays = needle ? [] : birthdaysThisWeek(people);
  const [rowCount, setRowCount] = useState(ROWS_PER_PAGE);
  const hasMoreRows = rowCount < shownFriends.length;
  const endMarker = useInfiniteScroll(() => setRowCount((count) => count + ROWS_PER_PAGE), { isActive: hasMoreRows, length: rowCount });

  useEffect(() => setRowCount(ROWS_PER_PAGE), [needle]);

  const friendsSection = () => {
    if (!hasFriends) {
      return (
        <Box sx={{ px: 1 }}>
          <PersonSkeletons />
        </Box>
      );
    }
    if (!people.length && !needle) {
      return (
        <PaneEmpty text="No friends yet. Find people by name or @username, or start with people you share a group with.">
          <Button component={Link} to={FIND_PATH} variant="contained">
            Find people
          </Button>
        </PaneEmpty>
      );
    }
    return (
      shownFriends.length > 0 && (
        <>
          <SectionLabel label="Friends" count={shownFriends.length} />
          <Box component="ul" sx={{ m: 0, p: 0 }}>
            {shownFriends.slice(0, rowCount).map((person) => (
              <PersonRow key={person._id} person={person} isSelected={Boolean(handle) && isAddressOf(person, handle)} isOnline={isOnline(person, onlineFriends)} />
            ))}
          </Box>
          {hasMoreRows && <Box ref={endMarker} aria-hidden sx={{ height: 1 }} />}
        </>
      )
    );
  };

  return (
    <Stack component="nav" aria-label="Contacts" sx={{ height: "100%", bgcolor: "chat.list" }}>
      <Stack spacing={1.75} sx={{ px: 2, pt: 1.25, pb: 1.25 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ minHeight: 44 }}>
          <Typography component="h1" sx={{ m: 0 }}>
            <Wordmark name="Contacts" fontSize={30} />
          </Typography>
          <Tooltip title="Find people">
            <IconButton
              component={Link}
              to={FIND_PATH}
              state={{ focusSearch: true }}
              aria-label="Find people"
              aria-current={isFinding ? "page" : undefined}
              sx={{
                width: 40,
                height: 40,
                color: isFinding ? "primary.contrastText" : "primary.main",
                bgcolor: (theme) => (isFinding ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.1)),
                "&:hover": { bgcolor: (theme) => (isFinding ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.18)) },
              }}
            >
              <UserPlus size={20} weight="bold" />
            </IconButton>
          </Tooltip>
        </Stack>
        <SearchPill value={query} onChange={setQuery} label="Search friends" />
      </Stack>

      <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 2 }}>
        {!needle && <RequestsRow isSelected={isRequests} isWide={isWide} />}
        {birthdays.length > 0 && <BirthdaysThisWeek people={birthdays} onlineFriends={onlineFriends} />}
        {friendsSection()}
        {hasFriends && needle && !shownFriends.length && <NoFriendMatches query={query.trim()} onLeave={() => setQuery("")} />}
      </Box>
    </Stack>
  );
};

export default ContactsList;
