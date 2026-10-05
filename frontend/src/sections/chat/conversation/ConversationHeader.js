import { useState } from "react";
import {
  Box,
  ButtonBase,
  Stack,
  useTheme,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";

import { VideoCamera, Phone, XCircle } from "phosphor-react";

// redux imports
import { useDispatch, useSelector } from "react-redux";
import { CloseConversation } from "@/redux/slices/actions/chatActions";

import getAvatar from "@/utils/createAvatar";
import StyledBadge from "@/components/StyledBadge";
import GroupInfoDrawer from "@/sections/chat/group/GroupInfoDrawer";
import { membersLabel } from "@/utils/groups";

// while this tab is disconnected the friend's status is stale, so the header says what is happening instead
const CONNECTION_NOTICE = {
  connecting: "Connecting…",
  offline: "Offline, messages send when you are back",
};

const GroupTitle = ({ group, notice }) => {
  const theme = useTheme();
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  return (
    <>
      <ButtonBase
        onClick={() => setIsInfoOpen(true)}
        aria-label={`${group.name}, group info`}
        sx={{
          borderRadius: 1,
          gap: 2,
          justifyContent: "flex-start",
          textAlign: "left",
        }}
      >
        {getAvatar(group.picture, group.name, theme)}
        <Stack spacing={0.2}>
          <Typography variant="subtitle2">{group.name}</Typography>
          <Typography variant="caption" role="status">
            {notice ?? membersLabel(group)}
          </Typography>
        </Stack>
      </ButtonBase>
      <GroupInfoDrawer
        group={group}
        open={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </>
  );
};

const ConversationHeader = ({ otherUser }) => {
  const theme = useTheme();

  const dispatch = useDispatch();
  const connection = useSelector((state) => state.chat.connection);
  const activeConversation = useSelector(
    (state) => state.chat.activeConversation,
  );
  const notice = CONNECTION_NOTICE[connection];

  return (
    <Box
      p={2}
      width={"100%"}
      sx={{
        position: "sticky",
        backgroundColor: theme.palette.background.default,
        boxShadow: "0px 0px 2px rgba(0, 0, 0, 0.25)",
      }}
    >
      {/* main stack */}
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        {activeConversation?.isGroup ? (
          <GroupTitle group={activeConversation} notice={notice} />
        ) : (
          <Stack
            direction={"row"}
            justifyContent={"center"}
            alignItems={"center"}
            spacing={2}
          >
            {otherUser?.onlineStatus === "online" ? (
              <StyledBadge
                overlap="circular"
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                variant="dot"
              >
                {getAvatar(otherUser?.avatar, otherUser?.firstName, theme)}
              </StyledBadge>
            ) : (
              getAvatar(otherUser?.avatar, otherUser?.firstName, theme)
            )}

            <Stack spacing={0.2}>
              <Typography variant="subtitle2">{`${otherUser?.firstName} ${otherUser?.lastName}`}</Typography>
              <Typography
                variant="caption"
                role="status"
                sx={{ textTransform: notice ? "none" : "capitalize" }}
              >
                {notice ?? otherUser?.onlineStatus}
              </Typography>
            </Stack>
          </Stack>
        )}
        {/* header actions */}
        <Stack
          direction={"row"}
          justifyContent={"center"}
          alignItems={"center"}
          spacing={1}
        >
          {/* video call action */}
          <IconButton>
            <VideoCamera />
          </IconButton>

          {/* voice call action */}
          <IconButton>
            <Phone />
          </IconButton>

          <Divider orientation="vertical" flexItem />
          {/* search action */}
          <IconButton
            onClick={() => {
              dispatch(CloseConversation());
            }}
          >
            <XCircle />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
};
export default ConversationHeader;
