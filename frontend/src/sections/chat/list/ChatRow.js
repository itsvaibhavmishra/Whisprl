import { memo } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { m } from "framer-motion";
import { BellSlash, Camera, Check, Checks, FileText, Microphone, Star, User, UsersThree, VideoCamera } from "phosphor-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import useSettings from "@/hooks/useSettings";
import ChatAvatar from "@/sections/chat/ChatAvatar";
import TypingDots from "@/components/TypingDots";
import { chatPath, useChatAddress } from "@/sections/chat/chatRoute";
import AvatarChoices from "@/sections/chat/status/AvatarChoices";
import useLiveStatuses from "@/sections/chat/status/useLiveStatuses";
import { badgeOf, identityOf, isMuted, isOnline as isPersonOnline } from "@/utils/chats";
import formatTime from "@/utils/formatTime";
import { describeEvent, memberOf, typingLabel, typingNamesIn } from "@/utils/groups";
import { quoteSummaryOf, summaryOf } from "@/utils/messageSummary";
import { SPOKEN_ONLY } from "@/utils/spokenOnly";

const ROW_SLIDE = { type: "spring", stiffness: 520, damping: 42 };
const REORDER = { duration: 0.28, ease: [0.33, 1, 0.68, 1] };
const PREVIEW_ICONS = { image: Camera, video: VideoCamera, voice: Microphone, document: FileText };
const AVATAR_SIZE = 50;

const previewIconOf = (message) => {
  if (message.deletedAt || message.undecryptable) return null;
  if (message.contact) return User;
  return PREVIEW_ICONS[message.file?.kind] ?? null;
};


const Receipt = ({ message }) => {
  if (message.seenAt) return <Checks size={16} weight="bold" role="img" aria-label="Seen" />;
  if (message.deliveredAt) return <Checks size={16} role="img" aria-label="Delivered" />;
  return <Check size={16} role="img" aria-label="Sent" />;
};

// the row is a link, so the avatar's own button lies over it as a sibling rather than nesting inside it
const RowAvatarChoices = ({ conversationId, name, peerId, hasStatus, isGroup }) => {
  const navigate = useNavigate();
  const { chatId, isInfo } = useChatAddress();

  // two steps, so Back closes the details and then the chat, as if each had been opened by hand
  const viewProfile = () => {
    if (chatId === conversationId && isInfo) return;
    if (chatId !== conversationId) navigate(chatPath(conversationId), { state: { isFromList: !chatId } });
    navigate(chatPath(conversationId, true), { state: { isFromChat: true } });
  };

  return (
    <AvatarChoices
      name={name}
      ownerId={peerId}
      hasStatus={hasStatus}
      other={isGroup ? { noun: "group info", label: "View group info", icon: UsersThree, onChoose: viewProfile } : { noun: "profile", label: "View profile", icon: User, onChoose: viewProfile }}
      sx={{
        position: "absolute",
        zIndex: 1,
        top: "50%",
        left: (theme) => theme.spacing(1),
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        transform: "translateY(-50%)",
        "&.Mui-focusVisible": { outline: 2, outlineColor: "primary.main", outlineOffset: 6 },
      }}
    />
  );
};

const ChatRow = ({ conversation, isActive, hasChatOpen }) => {
  const { use24Hour } = useSettings();
  const meId = useSelector((state) => state.user.user._id);
  const onlineFriends = useSelector((state) => state.user.onlineFriends);
  const typingConversation = useSelector((state) => state.chat.typingConversation);
  const draft = useSelector((state) => state.chat.drafts[conversation._id]);

  const { name, avatar, peer } = identityOf(conversation, meId);
  const latest = conversation.latestMessage;
  const reaction = conversation.latestReaction;
  const isReactionLatest = Boolean(reaction) && (!latest || new Date(reaction.at) > new Date(latest.createdAt));
  const activityAt = isReactionLatest ? reaction.at : latest?.createdAt;
  const unread = conversation.unread ?? 0;
  const isQuiet = isMuted(conversation);
  const isOnline = Boolean(peer && peer._id !== meId && isPersonOnline(peer, onlineFriends));
  const typists = typingNamesIn(conversation, typingConversation, meId);
  const isLatestMine = latest?.sender?._id === meId && !latest.event;
  const hasReceipt = isLatestMine && !conversation.isGroup && peer?._id !== meId;
  const statuses = useLiveStatuses(peer?._id);

  const authorOf = (message) => {
    if (!conversation.isGroup) return "";
    return message.sender?._id === meId ? "You: " : `${message.sender?.firstName}: `;
  };

  const reactionLine = ({ user, emoji, message, isForAlbum }) => {
    const reactor = user === meId ? "You" : memberOf(conversation, user)?.firstName ?? "Someone";
    return `${reactor} reacted ${emoji} to “${isForAlbum ? "Photos" : quoteSummaryOf(message, meId)}”`;
  };

  // what is happening now outranks what was said last: typing, then an unsent draft, then the newest reaction or message
  const preview = () => {
    if (typists.length) return { text: typingLabel(typists, conversation.isGroup), isLive: true };
    if (draft && !isActive) return { label: "Draft:", text: draft };
    if (isReactionLatest) return { text: reactionLine(reaction) };
    if (!latest) return { text: "" };
    if (latest.event) return { text: describeEvent(latest, conversation, meId) };
    return { text: `${authorOf(latest)}${summaryOf(latest)}`, icon: previewIconOf(latest) };
  };
  const { label, text, isLive, icon: PreviewIcon } = preview();

  const previewColor = () => {
    if (isLive) return "primary.main";
    return unread ? "text.primary" : "text.secondary";
  };

  return (
    <Box
      component={m.li}
      layout="position"
      transition={REORDER}
      sx={{ listStyle: "none", position: "relative", "&:hover > a": { bgcolor: isActive ? "transparent" : "action.hover" } }}
    >
      {isActive && (
        <Box
          component={m.span}
          layoutId="chat-active"
          transition={ROW_SLIDE}
          sx={{ position: "absolute", inset: 0, borderRadius: 3, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12) }}
        />
      )}
      <RowAvatarChoices conversationId={conversation._id} name={name} peerId={peer?._id} hasStatus={statuses.length > 0} isGroup={conversation.isGroup} />
      <ButtonBase
        component={Link}
        to={chatPath(conversation._id)}
        state={{ isFromList: !hasChatOpen }}
        onClick={isActive ? (event) => event.preventDefault() : undefined}
        aria-current={isActive ? "page" : undefined}
        sx={{
          position: "relative",
          width: "100%",
          gap: 1.5,
          px: 1,
          py: 1,
          borderRadius: 3,
          justifyContent: "flex-start",
          textAlign: "left",
          transition: "background-color 160ms ease",
        }}
      >
        <ChatAvatar src={avatar} name={name} size={AVATAR_SIZE} isOnline={isOnline} statuses={statuses} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography noWrap sx={{ flex: 1, fontSize: 15, fontWeight: unread ? 800 : 700, letterSpacing: "-0.01em" }}>
              {name}
            </Typography>
            {activityAt && (
              <Typography
                component="time"
                dateTime={activityAt}
                sx={{
                  fontSize: 12,
                  fontWeight: unread ? 800 : 500,
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                  color: unread && !isQuiet ? "primary.main" : "text.secondary",
                }}
              >
                {formatTime(activityAt, use24Hour)}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.25, color: "text.secondary" }}>
            {hasReceipt && !isLive && !label && !isReactionLatest && (
              <Box component="span" sx={{ display: "grid", color: latest.seenAt ? "primary.main" : "text.disabled" }}>
                <Receipt message={latest} />
              </Box>
            )}
            <Typography
              noWrap
              component="span"
              sx={{ flex: 1, fontSize: 14, fontWeight: unread ? 600 : 500, color: previewColor() }}
            >
              {label && (
                <Box component="span" sx={{ color: (theme) => theme.palette.error[theme.palette.mode === "light" ? "dark" : "main"], fontWeight: 700, mr: 0.5 }}>
                  {label}
                </Box>
              )}
              {isLive && (
                <Box component="span" sx={{ mr: 0.75 }}>
                  <TypingDots size={4} />
                </Box>
              )}
              {PreviewIcon && <PreviewIcon size={15} weight="bold" aria-hidden style={{ verticalAlign: "-2px", marginRight: 4 }} />}
              {text}
            </Typography>
            {conversation.isFavourite && <Star size={14} weight="fill" role="img" aria-label="Favourite" style={{ flexShrink: 0 }} />}
            {isQuiet && <BellSlash size={14} role="img" aria-label="Muted" style={{ flexShrink: 0 }} />}
            {unread > 0 && (
              <Box
                aria-hidden
                sx={{
                  minWidth: 22,
                  height: 22,
                  px: 0.75,
                  borderRadius: 99,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: isQuiet ? "text.disabled" : "primary.main",
                  color: isQuiet ? "background.default" : "primary.contrastText",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {badgeOf(unread)}
              </Box>
            )}
            {unread > 0 && <Box component="span" sx={SPOKEN_ONLY}>{`${unread} unread`}</Box>}
          </Stack>
        </Box>
      </ButtonBase>
    </Box>
  );
};

export default memo(ChatRow);
