import { useEffect } from "react";
import { Box } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import CommonGroups from "@/components/profile/CommonGroups";
import ProfileIdentity from "@/components/profile/ProfileIdentity";
import { GetUserData } from "@/redux/slices/actions/contactActions";
import { GetCommonGroups } from "@/redux/slices/actions/messageActions";
import { identityOf, isOnline } from "@/utils/chats";

const PersonDetails = ({ conversation, sharedContent, quickActions }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const onlineFriends = useSelector((state) => state.user.onlineFriends);
  const { peer } = identityOf(conversation, meId);
  const isSelf = peer._id === meId;
  // the chat carries only what a message needs, so badges come with the full profile
  const ownBadges = useSelector((state) => state.user.user.badges);
  const fetchedBadges = useSelector((state) => state.contact.profiles[peer._id]?.badges);
  const badges = isSelf ? ownBadges : fetchedBadges;

  useEffect(() => {
    if (isSelf) return;
    dispatch(GetUserData(peer._id));
    dispatch(GetCommonGroups(peer._id));
  }, [dispatch, isSelf, peer._id]);

  return (
    <>
      <Box sx={{ pb: 2.5 }}>
        <ProfileIdentity person={{ ...peer, badges }} size="panel" isOnline={!isSelf && isOnline(peer, onlineFriends)} />
      </Box>
      {quickActions}
      {sharedContent}
      {!isSelf && <CommonGroups personId={peer._id} />}
    </>
  );
};

export default PersonDetails;
