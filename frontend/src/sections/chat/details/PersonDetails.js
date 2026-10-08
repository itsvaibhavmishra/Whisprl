import { Box } from "@mui/material";
import { useSelector } from "react-redux";

import CommonGroups from "@/components/profile/CommonGroups";
import ProfileIdentity from "@/components/profile/ProfileIdentity";
import { identityOf, isOnline } from "@/utils/chats";

const PersonDetails = ({ conversation, sharedContent, quickActions }) => {
  const meId = useSelector((state) => state.user.user._id);
  const onlineFriends = useSelector((state) => state.user.onlineFriends);
  const { peer } = identityOf(conversation, meId);
  const isSelf = peer._id === meId;

  return (
    <>
      <Box sx={{ pb: 2.5 }}>
        <ProfileIdentity person={peer} size="panel" isOnline={!isSelf && isOnline(peer, onlineFriends)} />
      </Box>
      {quickActions}
      {sharedContent}
      {!isSelf && <CommonGroups personId={peer._id} />}
    </>
  );
};

export default PersonDetails;
