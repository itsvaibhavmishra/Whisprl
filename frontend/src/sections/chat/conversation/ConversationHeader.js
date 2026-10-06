import { Box, ButtonBase, IconButton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ArrowLeft, Info, MagnifyingGlass, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import StyledBadge from "@/components/StyledBadge";
import { CloseConversation } from "@/redux/slices/actions/chatActions";
import { setDetailsOpen } from "@/redux/slices/chatSlice";
import { identityOf, isOnline as isPersonOnline } from "@/utils/chats";
import getAvatar from "@/utils/createAvatar";
import { membersLabel, typingLabel, typingNamesIn } from "@/utils/groups";

// while this tab is disconnected the friend's status is stale, so the header says what is happening instead
const CONNECTION_NOTICE = {
  connecting: "Connecting…",
  offline: "Offline, messages send when you are back",
};

const HeaderButton = ({ label, onClick, isPressed, children }) => (
  <Tooltip title={label}>
    <IconButton aria-label={label} aria-pressed={isPressed} onClick={onClick} sx={{ color: isPressed ? "primary.main" : "text.secondary" }}>
      {children}
    </IconButton>
  </Tooltip>
);

const ConversationHeader = ({ isSearching, onToggleSearch }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const meId = useSelector((state) => state.user.user._id);
  const onlineFriends = useSelector((state) => state.user.onlineFriends);
  const { activeConversation: conversation, typingConversation, connection, isDetailsOpen } = useSelector((state) => state.chat);

  const { name, avatar, peer } = identityOf(conversation, meId);
  const isOnline = Boolean(peer && peer._id !== meId && isPersonOnline(peer, onlineFriends));
  const typists = typingNamesIn(conversation, typingConversation, meId);

  const subtitle = () => {
    if (CONNECTION_NOTICE[connection]) return CONNECTION_NOTICE[connection];
    if (typists.length) return typingLabel(typists, conversation.isGroup);
    if (conversation.isGroup) return membersLabel(conversation);
    if (peer?._id === meId) return "Notes to yourself";
    return isOnline ? "Online" : "Offline";
  };

  const avatarImage = getAvatar(avatar, name, theme, 42);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={{ xs: 0.5, md: 1 }}
      sx={{ px: { xs: 1, md: 2 }, py: 1, minHeight: 64, bgcolor: "background.default", borderBottom: 1, borderColor: "divider" }}
    >
      <IconButton aria-label="Back to chats" onClick={() => dispatch(CloseConversation())} sx={{ display: { md: "none" } }}>
        <ArrowLeft size={22} />
      </IconButton>

      <ButtonBase
        onClick={() => dispatch(setDetailsOpen(!isDetailsOpen))}
        aria-label={`${name}, ${isDetailsOpen ? "hide" : "show"} details`}
        sx={{ flex: 1, minWidth: 0, gap: 1.5, justifyContent: "flex-start", textAlign: "left", borderRadius: 2, p: 0.5 }}
      >
        {isOnline ? (
          <StyledBadge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }} variant="dot">
            {avatarImage}
          </StyledBadge>
        ) : (
          avatarImage
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {name}
          </Typography>
          <Typography
            variant="caption"
            role="status"
            noWrap
            component="p"
            sx={{ m: 0, color: typists.length ? "primary.main" : "text.secondary" }}
          >
            {subtitle()}
          </Typography>
        </Box>
      </ButtonBase>

      <HeaderButton label="Search this chat" isPressed={isSearching} onClick={onToggleSearch}>
        <MagnifyingGlass size={20} />
      </HeaderButton>
      <HeaderButton label="Details" isPressed={isDetailsOpen} onClick={() => dispatch(setDetailsOpen(!isDetailsOpen))}>
        <Info size={22} />
      </HeaderButton>
      {!isSmallScreen && (
        <HeaderButton label="Close chat" onClick={() => dispatch(CloseConversation())}>
          <X size={20} />
        </HeaderButton>
      )}
    </Stack>
  );
};

export default ConversationHeader;
