import { useCallback, useEffect, useRef } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { PaneSection } from "@/components/Pane";
import RequestButton from "@/components/profile/RequestButton";
import { SOFT } from "@/components/profile/RelationshipActions";
import useInfiniteScroll from "@/hooks/useInfiniteScroll";
import useIsLoading from "@/hooks/useIsLoading";
import useOpenChat from "@/hooks/useOpenChat";
import { FindEveryone } from "@/redux/slices/actions/contactActions";
import { GetPublicStatusesOf } from "@/redux/slices/actions/statusActions";
import PersonRow, { PersonRows, PersonSkeletons } from "@/sections/contacts/PersonRow";
import { isOnline } from "@/utils/chats";

const SEARCH_PAUSE_MS = 400;
const BACK_LABEL = "Back to search";
const NONE = [];

// one search in flight at a time, so a slow answer to earlier words never lands on later ones
const useEveryoneSearch = (needle) => {
  const dispatch = useDispatch();
  const inFlight = useRef(null);

  const search = useCallback(
    (page) => {
      inFlight.current?.abort();
      inFlight.current = dispatch(FindEveryone({ keyword: needle, page }));
      inFlight.current.then(({ payload }) => {
        const found = payload?.users ?? NONE;
        if (found.length) dispatch(GetPublicStatusesOf(found.map((person) => person._id)));
      });
    },
    [dispatch, needle]
  );

  useEffect(() => {
    const timer = setTimeout(() => search(0), SEARCH_PAUSE_MS);
    return () => {
      clearTimeout(timer);
      inFlight.current?.abort();
    };
  }, [search]);

  return search;
};

const MessageButton = ({ person }) => {
  const openChat = useOpenChat(person._id);
  return (
    <Button size="small" onClick={openChat} sx={{ ...SOFT, borderRadius: 99 }}>
      Message
    </Button>
  );
};

const EveryoneResults = ({ needle, query }) => {
  const friends = useSelector((state) => state.user.friends);
  const onlineFriends = useSelector((state) => state.user.onlineFriends);
  const { keyword, people, total, pages } = useSelector((state) => state.contact.everyone);
  const isLoading = useIsLoading(FindEveryone);
  const search = useEveryoneSearch(needle);

  const isAnswered = keyword === needle;
  const found = isAnswered ? people : NONE;
  const hasMore = isAnswered && found.length < total;
  const endMarker = useInfiniteScroll(() => search(pages), { isActive: hasMore && !isLoading, length: found.length });
  const friendIds = new Set(friends.map((friend) => friend._id));

  if (isAnswered && !found.length) {
    return <Typography sx={{ maxWidth: 440, fontSize: 14, fontWeight: 500, color: "text.secondary" }}>{`No one matches "${query}". Try their exact @username.`}</Typography>;
  }

  return (
    <PaneSection label="People" count={isAnswered ? total : 0}>
      <PersonRows>
        {found.map((person) =>
          friendIds.has(person._id) ? (
            <PersonRow key={person._id} person={person} isOnline={isOnline(person, onlineFriends)} action={<MessageButton person={person} />} backLabel={BACK_LABEL} />
          ) : (
            <PersonRow key={person._id} person={person} action={<RequestButton person={person} size="small" sx={{ borderRadius: 99 }} />} backLabel={BACK_LABEL} />
          )
        )}
      </PersonRows>
      {hasMore && <Box ref={endMarker} aria-hidden sx={{ height: 1 }} />}
      {(!isAnswered || hasMore) && <PersonSkeletons />}
    </PaneSection>
  );
};

export default EveryoneResults;
