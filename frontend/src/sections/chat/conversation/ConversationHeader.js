import { Box, ButtonBase, IconButton, Stack, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { ArrowLeft, Info, MagnifyingGlass, Timer, User, X } from "phosphor-react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useSelector } from "react-redux";

import ChatAvatar from "@/sections/chat/ChatAvatar";
import TypingDots from "@/components/TypingDots";
import { DETAILS_BUTTON_ID, useCloseChat, useDetailsToggle } from "@/sections/chat/chatRoute";
import { DETAILS_SLIDE } from "@/sections/chat/details/DetailsPanel";
import AvatarChoices from "@/sections/chat/status/AvatarChoices";
import useLiveStatuses from "@/sections/chat/status/useLiveStatuses";
import { identityOf, isOnline as isPersonOnline } from "@/utils/chats";
import { durationOf, membersLabel, typingLabel, typingNamesIn } from "@/utils/groups";

// while this tab is disconnected the friend's status is stale, so the header says what is happening instead
const CONNECTION_NOTICE = {
  connecting: "Connecting…",
  offline: "Offline, messages send when you are back",
};

export const GLASS_BAR = { position: "relative", zIndex: 2, bgcolor: "chat.glass", backdropFilter: "blur(18px) saturate(1.4)", borderBottom: 1, borderColor: "divider" };

const HeaderButton = ({ label, onClick, isPressed, children, ...button }) => (
  <Tooltip title={label}>
    <IconButton
      {...button}
      aria-label={label}
      aria-pressed={isPressed}
      onClick={onClick}
      sx={{ width: { xs: 44, md: 40 }, height: { xs: 44, md: 40 }, color: isPressed ? "primary.main" : "text.secondary", bgcolor: isPressed ? "action.selected" : "transparent" }}
    >
      {children}
    </IconButton>
  </Tooltip>
);

const ConversationHeader = ({ isSearching, onToggleSearch }) => {
  const isPhone = useMediaQuery((theme) => theme.breakpoints.down("md"));
  const isStill = useReducedMotion();
  const meId = useSelector((state) => state.user.user._id);
  const onlineFriends = useSelector((state) => state.user.onlineFriends);
  const { activeConversation: conversation, typingConversation, connection } = useSelector((state) => state.chat);
  const details = useDetailsToggle();

  const { name, avatar, peer } = identityOf(conversation, meId);
  const isOnline = Boolean(peer && peer._id !== meId && isPersonOnline(peer, onlineFriends));
  const typists = typingNamesIn(conversation, typingConversation, meId);
  const closeChat = useCloseChat();
  const statuses = useLiveStatuses(peer?._id);
  const hasStatus = statuses.length > 0;
  // without a status the avatar only repeats the name's button, so keyboards and screen readers skip it
  const avatarReach = hasStatus ? {} : { tabIndex: -1, "aria-hidden": true };

  const viewProfile = () => {
    if (!hasStatus) details.toggle();
    else if (!details.isInfo) details.open();
  };

  const subtitle = () => {
    if (CONNECTION_NOTICE[connection]) return CONNECTION_NOTICE[connection];
    if (typists.length) return typingLabel(typists, conversation.isGroup);
    if (conversation.isGroup) return membersLabel(conversation);
    if (peer?._id === meId) return "Notes to yourself";
    return isOnline ? "Online" : "Offline";
  };

  const subtitleColor = () => {
    if (typists.length) return "primary.main";
    if (!isOnline || CONNECTION_NOTICE[connection]) return "text.secondary";
    return (theme) => theme.palette.success[theme.palette.mode === "light" ? "dark" : "main"];
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={{ xs: 0.5, md: 1 }}
      sx={{
        ...GLASS_BAR,
        px: { xs: 0.5, md: 2 },
        pt: { xs: "max(6px, env(safe-area-inset-top))", md: 0 },
        pb: { xs: 0.75, md: 0 },
        minHeight: 64,
        flexShrink: 0,
      }}
    >
      {isPhone && (
        <IconButton aria-label="Back to chats" onClick={closeChat} sx={{ width: 44, height: 44 }}>
          <ArrowLeft size={22} weight="bold" />
        </IconButton>
      )}

      <Stack direction="row" alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
        <AvatarChoices
          name={name}
          ownerId={peer?._id}
          hasStatus={hasStatus}
          other={{ noun: "profile", label: "View profile", icon: User, onChoose: viewProfile }}
          {...avatarReach}
          sx={{ flexShrink: 0, p: 0.5 }}
        >
          <ChatAvatar src={avatar} name={name} size={44} isOnline={isOnline} statuses={statuses} />
        </AvatarChoices>
        <ButtonBase
          onClick={details.toggle}
          aria-label={`${name}, ${details.isInfo ? "hide" : "show"} details`}
          sx={{ flex: 1, minWidth: 0, justifyContent: "flex-start", textAlign: "left", borderRadius: 3, py: 0.5, pl: 1, pr: 1.5 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography noWrap sx={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                {name}
              </Typography>
              {conversation.disappearAfter && (
                <Box component="span" sx={{ display: "grid", color: "primary.main" }}>
                  <Timer size={16} weight="bold" aria-label={`Messages disappear after ${durationOf(conversation.disappearAfter)}`} />
                </Box>
              )}
            </Stack>
            <Typography
              role="status"
              noWrap
              sx={{ fontSize: 13, fontWeight: 600, color: subtitleColor(), display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}
            >
              {typists.length > 0 && <TypingDots size={4} />}
              <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {subtitle()}
              </Box>
            </Typography>
          </Box>
        </ButtonBase>
      </Stack>

      <HeaderButton label="Search this chat" isPressed={isSearching} onClick={onToggleSearch}>
        <MagnifyingGlass size={20} weight="bold" />
      </HeaderButton>
      <HeaderButton id={DETAILS_BUTTON_ID} label="Details" isPressed={details.isInfo} onClick={details.toggle}>
        <Info size={22} weight={details.isInfo ? "fill" : "bold"} />
      </HeaderButton>
      {/* folds away in step with the details panel opening, so the other buttons glide rather than jump */}
      <AnimatePresence initial={false}>
        {!isPhone && !details.isInfo && (
          <m.div
            key="close-chat"
            initial={{ width: 0, marginLeft: 0, opacity: 0 }}
            animate={{ width: 40, marginLeft: 8, opacity: 1 }}
            exit={{ width: 0, marginLeft: 0, opacity: 0 }}
            transition={isStill ? { duration: 0 } : DETAILS_SLIDE}
            style={{ overflow: "hidden", flexShrink: 0 }}
          >
            <HeaderButton label="Close chat" onClick={closeChat}>
              <X size={20} weight="bold" />
            </HeaderButton>
          </m.div>
        )}
      </AnimatePresence>
    </Stack>
  );
};

export default ConversationHeader;
