import { useEffect, useRef, useState } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { m, useReducedMotion } from "framer-motion";
import { ArrowBendUpRight, Prohibit } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import useMessageTime from "@/hooks/useMessageTime";
import { ReactToMessage } from "@/redux/slices/actions/messageActions";
import { setReplyingTo } from "@/redux/slices/chatSlice";
import ChatNote from "@/sections/chat/conversation/ChatNote";
import ContactCard from "@/sections/chat/messages/ContactCard";
import DocumentMessage from "@/sections/chat/messages/DocumentMessage";
import MediaMessage from "@/sections/chat/messages/MediaMessage";
import MessageActions from "@/sections/chat/messages/MessageActions";
import MessageMeta, { MetaSpacer } from "@/sections/chat/messages/MessageMeta";
import MessageText from "@/sections/chat/messages/MessageText";
import Reactions, { REACTIONS_DROP } from "@/sections/chat/messages/Reactions";
import ReplyQuote from "@/sections/chat/messages/ReplyQuote";
import VideoMessage from "@/sections/chat/messages/VideoMessage";
import ViewOnceMessage from "@/sections/chat/messages/ViewOnceMessage";
import VoiceMessage from "@/sections/chat/messages/VoiceMessage";
import SeenMarker, { SeenByRow } from "@/sections/chat/messages/SeenMarker";
import useSwipeToReply, { SwipeReplyHint } from "@/sections/chat/messages/useSwipeToReply";
import { mediaItemsOf } from "@/sections/chat/viewer/mediaItems";
import getAvatar, { nameColorOf } from "@/utils/avatars";
import { gradientOf } from "@/utils/gradients";
import { firstNameIn, memberOf } from "@/utils/groups";
import { filesOf, isMediaFile } from "@/utils/messageFiles";
import { myReactionOn, quickReactionsOf } from "@/utils/reactions";

const UNREADABLE = "This message can't be opened on this device";
const WAITING = "This message arrives when the sender is next online";
const LONG_PRESS_MS = 450;
const DOUBLE_TAP_MS = 300;

const flash = keyframes`
  0%, 60% { box-shadow: 0 0 0 3px var(--flash); }
  100% { box-shadow: 0 0 0 3px transparent; }
`;

// the corner nearest the next bubble in a run is tucked in, so a run of messages reads as one block
const cornersOf = (isMine, isStart, isEnd) => {
  const [outerTop, outerBottom] = [isStart ? 18 : 6, isEnd ? 18 : 6];
  return isMine ? `18px ${outerTop}px ${outerBottom}px 18px` : `${outerTop}px 18px 18px ${outerBottom}px`;
};

// fixed to the window, so every bubble of yours shows its own slice of one gradient and shifts as it scrolls
const ownBubble = (theme) => ({
  backgroundImage: gradientOf(theme.palette.primary.bubble, 180),
  backgroundAttachment: "fixed",
});

// revealed upwards rather than moved, since a transform on any ancestor would cut the fixed gradient loose
const RISE = { opacity: 0, clipPath: "inset(70% -48px -16px -48px)" };
const RISE_TO = { opacity: 1, clipPath: "inset(0% -48px -16px -48px)", transitionEnd: { clipPath: "none" } };
const RISE_TIMING = { duration: 0.26, ease: [0.33, 1, 0.68, 1] };

const MessageContainer = ({
  anchorKey,
  message,
  members,
  me: isMine,
  conversation,
  isQueued,
  isStartOfSequence,
  startsTurn,
  isEndOfSequence,
  msgType,
  showTime,
  statusLabel,
  footer,
  marker,
  senderName,
  seenBy,
  isHighlighted,
  isFresh,
  onToggleDetails,
  onJumpTo,
  onHoldStill,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const messageTime = useMessageTime();
  const isStill = useReducedMotion();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const pressTimer = useRef(null);
  const clickTimer = useRef(null);
  const lastClick = useRef(0);
  const wasLongPress = useRef(false);
  const swipe = useSwipeToReply(isMine ? -1 : 1, () => !message.deletedAt && dispatch(setReplyingTo(message)));

  useEffect(() => () => clearTimeout(clickTimer.current), []);

  const files = message.viewOnce ? [] : filesOf(message);
  const media = files.filter(isMediaFile);
  const mediaItems = media.length ? mediaItemsOf(members ?? [message]) : [];
  const hasMedia = media.length > 0;
  const hasDocs = files.some((file) => file.fileType === "document");
  const voice = files.find((file) => file.fileType === "voice");
  const isFileMsg = msgType === "file" || msgType === "file_with_caption";
  const isDeleted = Boolean(message.deletedAt);
  const isAlbum = Boolean(members);
  const hasReactions = Boolean(conversation && message.reactions?.length);
  const isBare = isDeleted || msgType === "emoji";
  // a deleted message keeps its menu, so anyone can still clear it from their own screen
  const hasMenu = Boolean(conversation && message._id && !isQueued && !message.event);
  const canAct = hasMenu && !isDeleted;

  const mentionNames = (message.mentions ?? []).map((userId) => memberOf(conversation, userId)?.firstName).filter(Boolean);
  const quotedSenderId = message.replyTo?.sender?._id ?? message.replyTo?.sender;
  const quotedAuthor = conversation?.isGroup && (quotedSenderId === user._id ? user : memberOf(conversation, quotedSenderId));

  // the reacted bubble stays where it is while its reactions appear or go
  const react = (emoji) => {
    onHoldStill?.(anchorKey);
    dispatch(ReactToMessage({ message, emoji, isForAlbum: isAlbum }));
  };
  // a group's list holds reactions to each photo as well as to the group, and each is taken back where it was made
  const removeReaction = (reaction) => {
    onHoldStill?.(anchorKey);
    dispatch(ReactToMessage({ message: reaction.message ?? message, emoji: reaction.emoji, isForAlbum: Boolean(reaction.isForAlbum) }));
  };
  const quickReact = () => canAct && react(quickReactionsOf(user)[0]);

  const surfaceOf = () => {
    if (isBare) return { bgcolor: "transparent" };
    if (isMine) return ownBubble(theme);
    return { bgcolor: "chat.bubbleIn", boxShadow: `inset 0 0 0 1px ${theme.palette.chat.edge}, 0 1px 2px ${theme.palette.chat.shade}` };
  };

  const paddingOf = () => {
    if (isFileMsg) return hasMedia ? 0 : 1;
    if (msgType === "text") return "8px 12px";
    return "3px 0px";
  };

  const interactions = hasMenu && {
    onContextMenu: (event) => {
      event.preventDefault();
      setMenuAnchor(event.currentTarget);
    },
    onTouchStart: (event) => {
      const bubble = event.currentTarget;
      wasLongPress.current = false;
      // only a new swipe is gated, so one under way still springs back if its message is deleted partway through
      if (canAct) swipe.handlers.onTouchStart(event);
      pressTimer.current = setTimeout(() => {
        wasLongPress.current = true;
        setMenuAnchor(bubble);
      }, LONG_PRESS_MS);
    },
    onTouchMove: (event) => {
      clearTimeout(pressTimer.current);
      swipe.handlers.onTouchMove(event);
    },
    onTouchEnd: () => {
      clearTimeout(pressTimer.current);
      swipe.handlers.onTouchEnd();
    },
  };

  // a single tap waits to see whether a second follows, so a double tap reacts without also opening the details
  const handleClick = (event) => {
    if (event.target.closest("img, a, button, video") || wasLongPress.current || swipe.wasSwiped.current) return;
    if (!canAct) return onToggleDetails?.();
    const now = Date.now();
    clearTimeout(clickTimer.current);
    if (now - lastClick.current < DOUBLE_TAP_MS) {
      lastClick.current = 0;
      quickReact();
      return;
    }
    lastClick.current = now;
    clickTimer.current = setTimeout(() => onToggleDetails?.(), DOUBLE_TAP_MS);
  };

  const toggleProps = onToggleDetails && !isDeleted && {
    onClick: handleClick,
    ...(!isFileMsg && {
      role: "button",
      tabIndex: 0,
      "aria-expanded": Boolean(showTime),
      onKeyDown: (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onToggleDetails();
      },
    }),
  };

  const textColor = isMine && !isDeleted ? "#fff" : theme.palette.text.primary;
  // a deleted message keeps only who sent it, since what it answered or passed on went with it
  const quote = !isDeleted && message.replyTo;
  const isForwarded = !isDeleted && message.forwarded;
  const hasHeader = isForwarded || quote || senderName;
  const isDirect = Boolean(conversation && !conversation.isGroup && conversation.users?.some((member) => member._id !== user._id));
  const hasTick = isMine && isDirect;
  const hasText = !isDeleted && !message.undecryptable && Boolean(message.message) && msgType !== "emoji";
  const metaPlaceOf = () => {
    if (hasText) return "float";
    if (voice) return "inline";
    return hasMedia && !message.message ? "overlay" : "block";
  };
  const metaPlace = metaPlaceOf();
  const meta = { message, hasTick, isQueued };
  const stamp = !isDeleted && (
    <MessageMeta
      {...meta}
      isOnBubble={msgType !== "emoji"}
      isMine={isMine}
      place={metaPlace}
      sx={metaPlace === "block" ? { px: isFileMsg ? 0.75 : 0, ...(msgType === "emoji" && isMine && { color: "primary.main" }) } : undefined}
    />
  );

  const actions = hasMenu && (
    <MessageActions
      message={message}
      members={members}
      conversation={conversation}
      isMine={isMine}
      menuAnchor={menuAnchor}
      onReact={react}
      onMenuClose={() => setMenuAnchor(null)}
    />
  );

  return (
    <Stack
      component={m.div}
      initial={isFresh && !isStill ? RISE : false}
      animate={RISE_TO}
      transition={RISE_TIMING}
      spacing={0.5}
      useFlexGap
      sx={{ mt: startsTurn ? { xs: 0.75, md: 1 } : 0 }}
    >
      {showTime && !isDeleted && <ChatNote sx={{ my: 0, px: 1.25, py: 0.25 }}>{messageTime(message.createdAt)}</ChatNote>}
      <Stack
        direction="row"
        justifyContent={isMine ? "flex-end" : "flex-start"}
        alignItems="center"
        sx={{
          position: "relative",
          mb: hasReactions ? `${REACTIONS_DROP}px` : 0,
          opacity: isQueued ? 0.75 : 1,
          "&:hover .message-tools, &:focus-within .message-tools": { opacity: 1 },
        }}
      >
        {!isMine && isEndOfSequence && (
          <Box sx={{ position: "absolute", bottom: 0, left: -36 }}>
            {getAvatar(message.sender.avatar, message.sender.firstName, 28)}
          </Box>
        )}
        {swipe.progress > 0 && <SwipeReplyHint progress={swipe.progress} side={isMine ? "right" : "left"} />}
        {/* the anchor is the bubble itself, so room opening below it for reactions moves what follows, never the bubble */}
        <Box
          data-message-key={anchorKey}
          sx={{
            position: "relative",
            minWidth: 0,
            transform: swipe.offset ? `translateX(${swipe.offset}px)` : "none",
            transition: swipe.offset ? "none" : "transform 180ms ease-out",
          }}
        >
          <Box
            p={paddingOf()}
            data-own={isMine || undefined}
            {...toggleProps}
            {...interactions}
            sx={{
              "--flash": alpha(theme.palette.primary.main, 0.55),
              position: "relative",
              cursor: toggleProps ? "pointer" : "default",
              display: "flex",
              flexDirection: "column",
              gap: hasHeader ? 0.75 : 0,
              justifyContent: "center",
              alignItems: "stretch",
              width: isFileMsg ? "auto" : "max-content",
              minWidth: 48,
              maxWidth: { xs: "17em", md: "28em" },
              minHeight: 38,
              color: textColor,
              ...surfaceOf(),
              border: isDeleted ? `1px dashed ${theme.palette.divider}` : "none",
              borderRadius: cornersOf(isMine, isStartOfSequence, isEndOfSequence),
              overflow: "hidden",
              touchAction: "pan-y",
              WebkitTouchCallout: "none",
              animation: isHighlighted ? `${flash} 1.6s ease-out` : "none",
            }}
          >
            {hasHeader && (
              <Stack spacing={0.75} sx={{ p: hasMedia || isFileMsg ? 0.75 : 0, pb: 0 }}>
                {senderName && (
                  <Typography component="p" noWrap sx={{ m: 0, fontSize: 13, fontWeight: 800, lineHeight: 1.2, color: nameColorOf(senderName, theme.palette.mode) }}>
                    {senderName}
                  </Typography>
                )}
                {isForwarded && (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.75 }}>
                    <ArrowBendUpRight size={12} />
                    <Typography variant="caption" sx={{ fontStyle: "italic" }}>
                      Forwarded
                    </Typography>
                  </Stack>
                )}
                {quote && (
                  <ReplyQuote
                    quote={quote}
                    isAlbum={message.replyToAlbum}
                    author={quotedAuthor}
                    authorName={firstNameIn(conversation, quotedSenderId, user._id)}
                    isMine={isMine}
                    conversation={conversation}
                    onJump={onJumpTo && (() => onJumpTo(quote._id))}
                  />
                )}
              </Stack>
            )}

            {isDeleted ? (
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ px: 1.5, py: 0.75, color: "text.secondary" }}>
                <Prohibit size={15} />
                <Typography sx={{ fontSize: 14, fontStyle: "italic" }}>{isMine ? "You deleted this message" : "This message was deleted"}</Typography>
              </Stack>
            ) : (
              <>
                {message.viewOnce && <ViewOnceMessage message={message} isMine={isMine} isGroup={conversation?.isGroup} meId={user._id} />}
                {message.contact && <ContactCard contact={message.contact} isMine={isMine} />}
                {hasMedia &&
                  (media.length === 1 && media[0].fileType === "video" ? <VideoMessage file={media[0]} /> : <MediaMessage items={mediaItems} conversation={conversation} />)}
                {voice && <VoiceMessage file={voice} isMine={isMine} stamp={stamp} />}
                {hasDocs && (
                  <Box sx={{ mt: hasMedia ? 0.5 : 0 }}>
                    <DocumentMessage files={files} />
                  </Box>
                )}
                {message.undecryptable ? (
                  <Typography sx={{ fontSize: 14, fontStyle: "italic", opacity: 0.75 }}>{message.awaitingKey ? WAITING : UNREADABLE}</Typography>
                ) : (
                  message.message && (
                    <MessageText
                      text={message.message}
                      mentionNames={mentionNames}
                      isMine={isMine}
                      variant={!isFileMsg && msgType === "emoji" ? "h3" : "body2"}
                      trailing={hasText && <MetaSpacer {...meta} />}
                      sx={{
                        fontSize: msgType === "emoji" ? undefined : 15,
                        fontWeight: 500,
                        lineHeight: 1.45,
                        ...(isFileMsg && { px: 1.25, pb: 0.75, pt: 0.75 }),
                        // a caption takes no width of its own, so it wraps beneath the photo instead of stretching the bubble
                        ...(hasMedia && { width: 0, minWidth: "100%", boxSizing: "border-box" }),
                      }}
                    />
                  )
                )}
              </>
            )}
            {metaPlace !== "inline" && stamp}
          </Box>
          {conversation && (
            <Reactions
              reactions={message.reactions ?? []}
              conversation={conversation}
              mine={myReactionOn(message, user._id, isAlbum)}
              side={isMine ? "right" : "left"}
              inset={isBare ? 0 : 10}
              onReact={react}
              onRemove={removeReaction}
            />
          )}
          {actions}
        </Box>
        {marker && <SeenMarker {...marker} messageId={message._id} />}
      </Stack>
      {footer}
      {statusLabel && !isDeleted && <ChatNote sx={{ alignSelf: "flex-end", my: 0, px: 1, py: 0.25, fontSize: 11.5 }}>{statusLabel}</ChatNote>}
      {seenBy?.length > 0 && <SeenByRow people={seenBy} />}
    </Stack>
  );
};

export default MessageContainer;
