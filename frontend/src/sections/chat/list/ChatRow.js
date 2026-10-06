import { Box, ButtonBase, Stack, Typography, useTheme } from "@mui/material";
import { BellSlash } from "phosphor-react";
import { alpha } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";

import StyledBadge from "@/components/StyledBadge";
import useSettings from "@/hooks/useSettings";
import { OpenConversation } from "@/redux/slices/actions/chatActions";
import { identityOf, isMuted, isOnline as isPersonOnline } from "@/utils/chats";
import getAvatar from "@/utils/createAvatar";
import formatTime from "@/utils/formatTime";
import { describeEvent, typingLabel, typingNamesIn } from "@/utils/groups";
import { summaryOf } from "@/utils/messageSummary";

const MAX_BADGE = 99;

const ChatRow = ({ conversation, isActive }) => {
  const theme = useTheme();
  const { use24Hour } = useSettings();
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const onlineFriends = useSelector((state) => state.user.onlineFriends);
  const typingConversation = useSelector((state) => state.chat.typingConversation);
  const draft = useSelector((state) => state.chat.drafts[conversation._id]);

  const { name, avatar, peer } = identityOf(conversation, meId);
  const latest = conversation.latestMessage;
  const unread = conversation.unread ?? 0;
  const isQuiet = isMuted(conversation);
  const isOnline = Boolean(peer && peer._id !== meId && isPersonOnline(peer, onlineFriends));
  const typists = typingNamesIn(conversation, typingConversation, meId);

  const authorOf = (message) => {
    if (message.sender?._id === meId) return "You: ";
    return conversation.isGroup ? `${message.sender?.firstName}: ` : "";
  };

  // what is happening now outranks what was said last: typing, then an unsent draft, then the latest message
  const preview = () => {
    if (typists.length) return { text: typingLabel(typists, conversation.isGroup), isLive: true };
    if (draft && !isActive) return { label: "Draft:", text: draft };
    if (!latest) return { text: "" };
    if (latest.event) return { text: describeEvent(latest, conversation, meId) };
    return { text: `${authorOf(latest)}${summaryOf(latest)}` };
  };
  const { label, text, isLive } = preview();

  const previewColor = () => {
    if (isLive) return "primary.main";
    return unread ? "text.primary" : "text.secondary";
  };

  const avatarImage = getAvatar(avatar, name, theme, 48);

  return (
    <Box component="li" sx={{ listStyle: "none" }}>
      <ButtonBase
        onClick={() => !isActive && dispatch(OpenConversation(conversation))}
        aria-current={isActive ? "true" : undefined}
        aria-label={`${name}${unread ? `, ${unread} unread` : ""}`}
        sx={{
          width: "100%",
          gap: 1.5,
          px: 1.5,
          py: 1.25,
          borderRadius: 2,
          justifyContent: "flex-start",
          textAlign: "left",
          bgcolor: isActive ? alpha(theme.palette.primary.main, 0.12) : "transparent",
          "&:hover": { bgcolor: isActive ? alpha(theme.palette.primary.main, 0.16) : "action.hover" },
        }}
      >
        {isOnline ? (
          <StyledBadge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }} variant="dot">
            {avatarImage}
          </StyledBadge>
        ) : (
          avatarImage
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography variant="subtitle2" noWrap sx={{ flex: 1, fontWeight: unread ? 800 : 600 }}>
              {name}
            </Typography>
            {isQuiet && <BellSlash size={14} aria-label="Muted" color={theme.palette.text.secondary} />}
            {latest && (
              <Typography
                variant="caption"
                sx={{ whiteSpace: "nowrap", color: unread && !isQuiet ? "primary.main" : "text.secondary", fontWeight: unread ? 700 : 400 }}
              >
                {formatTime(latest.createdAt, use24Hour)}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.25 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{ flex: 1, color: previewColor(), fontWeight: unread ? 600 : 400 }}
            >
              {label && (
                <Box component="span" sx={{ color: "primary.main", fontWeight: 700, mr: 0.5 }}>
                  {label}
                </Box>
              )}
              {text}
            </Typography>
            {unread > 0 && (
              <Box
                aria-hidden
                sx={{
                  minWidth: 20,
                  height: 20,
                  px: 0.75,
                  borderRadius: 99,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: isQuiet ? "text.disabled" : "primary.main",
                  color: "common.white",
                  typography: "caption",
                  fontWeight: 700,
                }}
              >
                {unread > MAX_BADGE ? `${MAX_BADGE}+` : unread}
              </Box>
            )}
          </Stack>
        </Box>
      </ButtonBase>
    </Box>
  );
};

export default ChatRow;
