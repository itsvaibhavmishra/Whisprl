import { useEffect, useState } from "react";
import { Box, List } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import CommonGroups from "@/components/profile/CommonGroups";
import ProfileFacts from "@/components/profile/ProfileFacts";
import ProfileIdentity from "@/components/profile/ProfileIdentity";
import RelationshipActions from "@/components/profile/RelationshipActions";
import SafetyRows from "@/components/profile/SafetyRows";
import useRelationship from "@/hooks/useRelationship";
import { GetUserData } from "@/redux/slices/actions/contactActions";
import { GetCommonGroups } from "@/redux/slices/actions/messageActions";
import { DetailsSection } from "@/sections/chat/details/DetailsSection";
import { isOnline } from "@/utils/chats";

const GUTTER = { page: { xs: 2, md: 4 }, sheet: 3 };
// each section already insets its text by 2.5, so it moves by the rest of the gutter to line up with the name
const SECTION_SHIFT = { page: { xs: -0.5, md: 1.5 }, sheet: 0.5 };

// what the opener already knows draws the profile at once, and the full profile fills in behind it
const ProfileView = ({ person: known, size = "sheet", surface, startWithComposer = false }) => {
  const dispatch = useDispatch();
  const fetched = useSelector((state) => state.contact.profiles[known._id]);
  const hasGroups = useSelector((state) => state.chat.commonGroups[known._id] !== undefined);
  const onlineFriends = useSelector((state) => state.user.onlineFriends);
  const person = { ...known, ...fetched };
  const relationship = useRelationship(person._id);
  const isFriend = relationship.state === "friend";
  const isSelf = relationship.state === "self";
  const [isAnswered, setIsAnswered] = useState(false);
  // what loads late appears below everything already showing, all at once, so nothing on screen moves when it lands
  const isComplete = isAnswered || (Boolean(fetched) && (isSelf || hasGroups));

  useEffect(() => {
    const groups = isSelf ? null : dispatch(GetCommonGroups(known._id));
    Promise.all([dispatch(GetUserData(known._id)), groups]).then(() => setIsAnswered(true));
  }, [dispatch, isSelf, known._id]);

  return (
    <Box sx={{ pb: 3 }}>
      <ProfileIdentity person={person} size={size} surface={surface} isOnline={isFriend && isOnline(person, onlineFriends)} />
      {person.firstName && (
        <>
          <Box sx={{ px: GUTTER[size], pt: 2.5, display: "flex", flexDirection: "column" }}>
            <RelationshipActions person={person} relationship={relationship} startWithComposer={startWithComposer} />
          </Box>
          <Box sx={{ mx: SECTION_SHIFT[size] }}>
            <ProfileFacts person={person} />
            {isComplete && !isSelf && <CommonGroups personId={person._id} />}
            {isComplete && !isSelf && (
              <DetailsSection title="Privacy and safety">
                <List disablePadding>
                  <SafetyRows person={person} canRemoveFriend={isFriend} />
                </List>
              </DetailsSection>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default ProfileView;
