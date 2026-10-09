import { useEffect, useState } from "react";
import { Box, IconButton } from "@mui/material";
import { ArrowLeft } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { PANE_INSET, PaneEmpty, READING_WIDTH } from "@/components/Pane";
import ProfileIdentity from "@/components/profile/ProfileIdentity";
import ProfileView from "@/components/profile/ProfileView";
import useHasSettled from "@/hooks/useHasSettled";
import { FindProfile, GetRequests, GetUserData } from "@/redux/slices/actions/contactActions";
import { GetFriends } from "@/redux/slices/actions/userActions";
import { isAddressOf } from "@/sections/contacts/contactsRoute";

const SURFACE = { xs: "chat.list", md: "chat.canvas" };

const peopleIn = (state) => [
  ...state.user.friends,
  ...state.contact.incoming.map((request) => request.person),
  ...state.contact.outgoing.map((request) => request.person),
  ...state.contact.everyone.people,
  ...state.contact.suggestions,
  ...Object.values(state.contact.profiles),
];

// someone opened by their address is looked for among the people already here before the server is asked
const usePersonAt = (handle) => {
  const dispatch = useDispatch();
  const known = useSelector((state) => peopleIn(state).find((person) => isAddressOf(person, handle)));
  const [isMissing, setIsMissing] = useState(false);
  const isLooking = !known;

  useEffect(() => {
    if (!isLooking) return;
    const lookup = handle.startsWith("@") ? FindProfile(handle.slice(1)) : GetUserData(handle);
    dispatch(lookup).then((result) => setIsMissing(result.meta.requestStatus === "rejected"));
  }, [dispatch, handle, isLooking]);

  return { person: known, isMissing };
};

const PersonPane = ({ handle, onBack }) => {
  const { person, isMissing } = usePersonAt(handle);
  const hasFriends = useHasSettled(GetFriends);
  const hasRequests = useHasSettled(GetRequests);
  // a friend opened by their address before the lists arrive would otherwise be offered "Add friend"
  const isReady = Boolean(person) && hasFriends && hasRequests;

  return (
    <Box sx={{ height: "100%", overflowY: "auto", bgcolor: SURFACE }}>
      <Box sx={{ maxWidth: READING_WIDTH, mx: "auto", ...PANE_INSET }}>
        {onBack && (
          <Box sx={{ display: "flex", alignItems: "center", minHeight: 44, mb: 1.5 }}>
            <IconButton aria-label="Back to contacts" onClick={onBack} sx={{ ml: -1 }}>
              <ArrowLeft size={22} />
            </IconButton>
          </Box>
        )}
        {isMissing && <PaneEmpty text={`No one on Whisprl goes by ${handle}.`} />}
        {!isMissing && isReady && <ProfileView key={person._id} person={person} size="page" surface={SURFACE} />}
        {!isMissing && !isReady && <ProfileIdentity person={{ _id: handle }} size="page" surface={SURFACE} />}
      </Box>
    </Box>
  );
};

export default PersonPane;
