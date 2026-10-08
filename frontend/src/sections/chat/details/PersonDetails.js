import { useEffect, useState } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { ImageSquare, Quotes } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { OpenConversation } from "@/redux/slices/actions/chatActions";
import { GetCommonGroups } from "@/redux/slices/actions/messageActions";
import ChatAvatar from "@/sections/chat/ChatAvatar";
import HaloAvatar from "@/sections/chat/details/HaloAvatar";
import { DetailsSection } from "@/sections/chat/details/DetailsSection";
import PhotoViewer from "@/sections/chat/details/PhotoViewer";
import AvatarChoices from "@/sections/chat/status/AvatarChoices";
import useLiveStatuses from "@/sections/chat/status/useLiveStatuses";
import { identityOf, isOnline as isPersonOnline } from "@/utils/chats";

const PersonDetails = ({ conversation, sharedContent, quickActions }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const conversations = useSelector((state) => state.chat.conversations);
  const onlineFriends = useSelector((state) => state.user.onlineFriends);
  const { name, avatar, peer } = identityOf(conversation, meId);
  const isSelf = peer._id === meId;
  const commonGroups = useSelector((state) => state.chat.commonGroups[peer._id]);
  const statuses = useLiveStatuses(peer._id);
  const [isViewingPhoto, setIsViewingPhoto] = useState(false);
  const photoView = avatar ? { noun: "profile picture", label: "View profile picture", icon: ImageSquare, onChoose: () => setIsViewingPhoto(true) } : null;

  useEffect(() => {
    if (!isSelf) dispatch(GetCommonGroups(peer._id));
  }, [dispatch, isSelf, peer._id]);

  const openGroup = (groupId) => {
    const group = conversations.find((candidate) => candidate._id === groupId);
    if (group) dispatch(OpenConversation(group));
  };

  const groupCount = commonGroups?.length ?? 0;
  const groupsTitle = `${groupCount} group${groupCount === 1 ? "" : "s"} in common`;

  return (
    <>
      <Stack alignItems="center" sx={{ px: 3, pt: 3.5, pb: 2.5, textAlign: "center" }}>
        <AvatarChoices name={name} ownerId={peer._id} hasStatus={statuses.length > 0} other={photoView} menuAlign="center">
          <HaloAvatar src={avatar} name={name} isOnline={!isSelf && isPersonOnline(peer, onlineFriends)} statuses={statuses} />
        </AvatarChoices>
        <Typography sx={{ mt: 2, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.25 }}>{name}</Typography>
        {peer.username && <Typography sx={{ mt: 0.25, fontSize: 14, fontWeight: 700, color: "primary.main" }}>@{peer.username}</Typography>}
        {peer.activityStatus && (
          <Stack direction="row" spacing={1} sx={{ mt: 2, px: 2, py: 1.25, borderRadius: 3, bgcolor: "chat.field", textAlign: "left", maxWidth: "100%" }}>
            <Box sx={{ color: "primary.main", display: "grid", pt: 0.25 }}>
              <Quotes size={16} weight="fill" />
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary" }}>{peer.activityStatus}</Typography>
          </Stack>
        )}
      </Stack>

      {quickActions}
      {sharedContent}

      {!isSelf && groupCount > 0 && (
        <DetailsSection title={groupsTitle}>
          {commonGroups.map((group) => (
            <ButtonBase
              key={group._id}
              onClick={() => openGroup(group._id)}
              sx={{ width: "100%", gap: 1.5, px: 1, py: 1, borderRadius: 3, justifyContent: "flex-start", textAlign: "left", "&:hover": { bgcolor: "action.hover" } }}
            >
              <ChatAvatar src={group.picture} name={group.name} size={40} />
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>{group.name}</Typography>
                <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>{group.memberCount} members</Typography>
              </Box>
            </ButtonBase>
          ))}
        </DetailsSection>
      )}

      {isViewingPhoto && <PhotoViewer src={avatar} name={name} onClose={() => setIsViewingPhoto(false)} />}
    </>
  );
};

export default PersonDetails;
