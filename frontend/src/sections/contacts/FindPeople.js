import { useEffect, useRef } from "react";
import { Box, IconButton, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useSearchParams } from "react-router-dom";

import Pane, { PaneSection, READING_WIDTH } from "@/components/Pane";
import RequestButton from "@/components/profile/RequestButton";
import SearchPill from "@/components/SearchPill";
import useHasSettled from "@/hooks/useHasSettled";
import { GetSuggestions, HideSuggestion } from "@/redux/slices/actions/contactActions";
import { GetPublicStatusesOf } from "@/redux/slices/actions/statusActions";
import EveryoneResults from "@/sections/contacts/EveryoneResults";
import PersonRow, { PersonRows, PersonSkeletons } from "@/sections/contacts/PersonRow";
import ProfilePass from "@/sections/contacts/ProfilePass";

const SEARCH_LABEL = "Search everyone by name or @username";
// the pane is grey on a computer and white on a phone, so the field takes whichever stands out
const FIELD_ON_PANE = { bgcolor: { xs: "chat.field", md: "chat.list" }, borderColor: { xs: "transparent", md: "chat.edge" } };

const listed = (names, count) => {
  const others = count - names.length;
  if (others > 0) return `${names.join(", ")} and ${others} more`;
  return names.join(" and ");
};

const reasonOf = ({ mutualFriends, sharedGroups }) => {
  if (mutualFriends.count) return `Friends with ${listed(mutualFriends.names, mutualFriends.count)}`;
  const others = sharedGroups.count - 1;
  return others > 0 ? `In ${sharedGroups.names[0]} and ${others} more group${others === 1 ? "" : "s"}` : `In ${sharedGroups.names[0]}`;
};

const SuggestionActions = ({ person }) => {
  const dispatch = useDispatch();
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <RequestButton person={person} size="small" sx={{ borderRadius: 99 }} />
      <Tooltip title="Hide">
        <IconButton size="small" aria-label={`Hide ${person.firstName} from your suggestions`} onClick={() => dispatch(HideSuggestion(person._id))} sx={{ color: "text.secondary" }}>
          <X size={16} weight="bold" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

const Suggestions = () => {
  const friends = useSelector((state) => state.user.friends);
  const suggestions = useSelector((state) => state.contact.suggestions);
  const hasSuggestions = useHasSettled(GetSuggestions);
  // someone who said yes since the list was made is a friend now, not a suggestion
  const shown = suggestions.filter((person) => !friends.some((friend) => friend._id === person._id));

  return (
    <PaneSection label="People you may know" count={shown.length}>
      {!hasSuggestions && <PersonSkeletons />}
      {hasSuggestions && !shown.length && (
        <Typography sx={{ mt: 1.5, maxWidth: 440, fontSize: 14, fontWeight: 500, color: "text.secondary" }}>
          No one to suggest yet. People show up here when your friends have friends you don't, or when you're in a group with someone.
        </Typography>
      )}
      <PersonRows>
        {shown.map((person) => (
          <PersonRow key={person._id} person={person} detail={reasonOf(person)} action={<SuggestionActions person={person} />} />
        ))}
      </PersonRows>
    </PaneSection>
  );
};

const FindPeople = ({ onBack }) => {
  const dispatch = useDispatch();
  const me = useSelector((state) => state.user.user);
  const isWide = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const { state: arrival } = useLocation();
  const [params, setParams] = useSearchParams();
  const field = useRef(null);
  const query = params.get("q") ?? "";
  const needle = query.trim().toLowerCase();

  useEffect(() => {
    dispatch(GetSuggestions()).then(({ payload }) => {
      const ids = payload?.suggestions?.map((person) => person._id) ?? [];
      if (ids.length) dispatch(GetPublicStatusesOf(ids));
    });
  }, [dispatch]);

  // the box takes the cursor when someone came here to search, but a phone keeps its keyboard down until asked
  useEffect(() => {
    if (isWide && arrival?.focusSearch) field.current?.focus();
  }, [isWide, arrival]);

  const changeQuery = (value) => setParams(value ? { q: value } : {}, { replace: true });

  return (
    <Pane title="Find people" subtitle="Search everyone on Whisprl, or start with people you may know." onBack={onBack} width={READING_WIDTH}>
      <SearchPill ref={field} value={query} onChange={changeQuery} label={SEARCH_LABEL} sx={FIELD_ON_PANE} />
      <Box sx={{ mt: 4 }}>
        {needle ? (
          <EveryoneResults needle={needle} query={query.trim()} />
        ) : (
          <>
            <ProfilePass person={me} />
            <Box sx={{ mt: 5 }}>
              <Suggestions />
            </Box>
          </>
        )}
      </Box>
    </Pane>
  );
};

export default FindPeople;
