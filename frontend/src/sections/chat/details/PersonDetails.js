import { useEffect } from "react";
import { Box, Divider, List, ListItemAvatar, ListItemButton, ListItemText, Stack, Typography, useTheme } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { OpenConversation } from "@/redux/slices/actions/chatActions";
import { GetCommonGroups } from "@/redux/slices/actions/messageActions";
import { identityOf } from "@/utils/chats";
import getAvatar from "@/utils/createAvatar";

const PersonDetails = ({ conversation, sharedContent }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const conversations = useSelector((state) => state.chat.conversations);
  const { name, avatar, peer } = identityOf(conversation, meId);
  const isSelf = peer._id === meId;
  const commonGroups = useSelector((state) => state.chat.commonGroups[peer._id]);

  useEffect(() => {
    if (!isSelf) dispatch(GetCommonGroups(peer._id));
  }, [dispatch, isSelf, peer._id]);

  const openGroup = (groupId) => {
    const group = conversations.find((candidate) => candidate._id === groupId);
    if (group) dispatch(OpenConversation(group));
  };

  return (
    <>
      <Stack alignItems="center" spacing={0.75} sx={{ px: 3, pt: 1, pb: 3, textAlign: "center" }}>
        <Box sx={{ mb: 1 }}>{getAvatar(avatar, name, theme, 96)}</Box>
        <Typography variant="h6">{name}</Typography>
        {peer.email && (
          <Typography variant="body2" sx={{ color: "text.secondary", wordBreak: "break-all" }}>
            {peer.email}
          </Typography>
        )}
        {peer.activityStatus && (
          <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
            {peer.activityStatus}
          </Typography>
        )}
      </Stack>

      <Divider />
      {sharedContent}

      {!isSelf && (
        <>
          <Divider />
          <Typography variant="subtitle2" sx={{ px: 2, pt: 2 }}>
            {commonGroups?.length ? `${commonGroups.length} group${commonGroups.length === 1 ? "" : "s"} in common` : "No groups in common"}
          </Typography>
          <List>
            {(commonGroups ?? []).map((group) => (
              <ListItemButton key={group._id} onClick={() => openGroup(group._id)}>
                <ListItemAvatar>{getAvatar(group.picture, group.name, theme, 36)}</ListItemAvatar>
                <ListItemText primary={group.name} secondary={`${group.memberCount} members`} />
              </ListItemButton>
            ))}
          </List>
        </>
      )}
    </>
  );
};

export default PersonDetails;
