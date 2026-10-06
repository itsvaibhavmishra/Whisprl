import { useEffect, useRef, useState } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { ArrowBendUpRight } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import { ReactToMessage } from "@/redux/slices/actions/messageActions";
import ContactCard from "@/sections/chat/messages/ContactCard";
import DocumentMessage from "@/sections/chat/messages/DocumentMessage";
import ImageMessage from "@/sections/chat/messages/ImageMessage";
import MessageActions from "@/sections/chat/messages/MessageActions";
import MessageText from "@/sections/chat/messages/MessageText";
import Reactions from "@/sections/chat/messages/Reactions";
import ReplyQuote from "@/sections/chat/messages/ReplyQuote";
import SeenMarker, { SeenByRow } from "@/sections/chat/messages/SeenMarker";
import getAvatar from "@/utils/createAvatar";
import { formatMessageTime } from "@/utils/formatMessageTime";
import { firstNameIn, memberOf } from "@/utils/groups";
import { filesOf } from "@/utils/messageFiles";
import { quickReactionsOf } from "@/utils/reactions";

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
  const [outerTop, outerBottom] = [isStart ? 20 : 6, isEnd ? 20 : 6];
  return isMine ? `20px ${outerTop}px ${outerBottom}px 20px` : `${outerTop}px 20px 20px ${outerBottom}px`;
};

const MessageContainer = ({
  anchorKey,
  message,
  me: isMine,
  conversation,
  isQueued,
  isStartOfSequence,
  isEndOfSequence,
  msgType,
  showTime,
  statusLabel,
  footer,
  marker,
  senderName,
  seenBy,
  isHighlighted,
  onToggleDetails,
  onJumpTo,
  onHoldStill,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const pressTimer = useRef(null);
  const clickTimer = useRef(null);
  const lastClick = useRef(0);
  const wasLongPress = useRef(false);

  useEffect(() => () => clearTimeout(clickTimer.current), []);

  const files = filesOf(message);
  const hasImages = files.some((file) => file.fileType === "image");
  const hasDocs = files.some((file) => file.fileType === "document");
  const isFileMsg = msgType === "file" || msgType === "file_with_caption";
  const isDeleted = Boolean(message.deletedAt);
  const hasReactions = Boolean(conversation && message.reactions?.length);
  const canAct = Boolean(conversation && message._id && !isQueued && !isDeleted && !message.event);

  const mentionNames = (message.mentions ?? []).map((userId) => memberOf(conversation, userId)?.firstName).filter(Boolean);

  // the reacted bubble stays where it is while its reactions appear or go
  const react = (emoji) => {
    onHoldStill?.(anchorKey);
    dispatch(ReactToMessage({ message, emoji }));
  };
  const quickReact = () => canAct && react(quickReactionsOf(user)[0]);

  const backgroundOf = () => {
    if (isDeleted || msgType === "emoji") return "transparent";
    return isMine ? theme.palette.primary.main : theme.palette.background.default;
  };

  const paddingOf = () => {
    if (isFileMsg) return hasImages ? 0 : 1;
    if (msgType === "text") return 1.5;
    return "3px 0px";
  };

  const interactions = canAct && {
    onContextMenu: (event) => {
      event.preventDefault();
      setMenuAnchor(event.currentTarget);
    },
    onTouchStart: (event) => {
      const bubble = event.currentTarget;
      wasLongPress.current = false;
      pressTimer.current = setTimeout(() => {
        wasLongPress.current = true;
        setMenuAnchor(bubble);
      }, LONG_PRESS_MS);
    },
    onTouchMove: () => clearTimeout(pressTimer.current),
    onTouchEnd: () => clearTimeout(pressTimer.current),
  };

  // a single tap waits to see whether a second follows, so a double tap reacts without also opening the details
  const handleClick = (event) => {
    if (event.target.closest("img, a, button") || wasLongPress.current) return;
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

  const toggleProps = onToggleDetails && {
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
  const hasHeader = message.forwarded || message.replyTo;

  const actions = canAct && (
    <MessageActions
      message={message}
      conversation={conversation}
      isMine={isMine}
      menuAnchor={menuAnchor}
      onReact={react}
      onMenuClose={() => setMenuAnchor(null)}
    />
  );

  return (
    <Stack spacing={0.5}>
      {showTime && (
        <Typography variant="caption" sx={{ alignSelf: "center", color: "text.secondary" }}>
          {formatMessageTime(message.createdAt)}
        </Typography>
      )}
      {senderName && (
        <Typography variant="caption" sx={{ color: "text.secondary", ml: 1.5 }}>
          {senderName}
        </Typography>
      )}
      <Stack
        direction="row"
        data-message-key={anchorKey}
        justifyContent={isMine ? "flex-end" : "flex-start"}
        alignItems="center"
        sx={{
          position: "relative",
          opacity: isQueued ? 0.7 : 1,
          "&:hover .message-tools, &:focus-within .message-tools": { opacity: 1 },
        }}
      >
        {!isMine && isEndOfSequence && (
          <Box sx={{ position: "absolute", top: msgType === "text" || isFileMsg ? 10 : 18, left: -25 }}>
            {getAvatar(message?.sender?.avatar, message?.sender?.firstName, theme, 20)}
          </Box>
        )}
        {isMine && actions}
        <Box sx={{ position: "relative", minWidth: 0, mb: hasReactions ? 1 : 0 }}>
          <Box
            p={paddingOf()}
            {...toggleProps}
            {...interactions}
            sx={{
              "--flash": alpha(theme.palette.primary.main, 0.55),
              cursor: onToggleDetails ? "pointer" : "default",
              display: "flex",
              flexDirection: "column",
              gap: hasHeader ? 0.75 : 0,
              justifyContent: "center",
              alignItems: "stretch",
              width: isFileMsg ? "auto" : "max-content",
              minWidth: 40,
              maxWidth: { xs: "16em", md: "26em" },
              minHeight: 40,
              color: textColor,
              backgroundColor: backgroundOf(),
              border: isDeleted ? `1px dashed ${theme.palette.divider}` : "none",
              borderRadius: cornersOf(isMine, isStartOfSequence, isEndOfSequence),
              overflow: "hidden",
              touchAction: "manipulation",
              WebkitTouchCallout: "none",
              animation: isHighlighted ? `${flash} 1.6s ease-out` : "none",
            }}
          >
            {hasHeader && (
              <Stack spacing={0.75} sx={{ p: hasImages ? 0.75 : 0 }}>
                {message.forwarded && (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.75 }}>
                    <ArrowBendUpRight size={12} />
                    <Typography variant="caption" sx={{ fontStyle: "italic" }}>
                      Forwarded
                    </Typography>
                  </Stack>
                )}
                {message.replyTo && (
                  <ReplyQuote
                    quote={message.replyTo}
                    authorName={firstNameIn(conversation, message.replyTo.sender?._id ?? message.replyTo.sender, user._id)}
                    isMine={isMine}
                    onJump={onJumpTo && (() => onJumpTo(message.replyTo._id))}
                  />
                )}
              </Stack>
            )}

            {isDeleted ? (
              <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary" }}>
                {isMine ? "You deleted this message" : "This message was deleted"}
              </Typography>
            ) : (
              <>
                {message.contact && <ContactCard contact={message.contact} isMine={isMine} />}
                {hasImages && <ImageMessage files={files} />}
                {hasDocs && (
                  <Box sx={{ mt: hasImages ? 0.5 : 0 }}>
                    <DocumentMessage files={files} />
                  </Box>
                )}
                {message.undecryptable ? (
                  <Typography variant="body2" sx={{ fontStyle: "italic", opacity: 0.75 }}>
                    {message.awaitingKey ? WAITING : UNREADABLE}
                  </Typography>
                ) : (
                  message.message && (
                    <MessageText
                      text={message.message}
                      mentionNames={mentionNames}
                      isMine={isMine}
                      variant={!isFileMsg && msgType === "emoji" ? "h3" : "body2"}
                      sx={isFileMsg ? { px: 1.5, pb: 1, pt: 0.5 } : undefined}
                    />
                  )
                )}
                {message.editedAt && (
                  <Typography variant="caption" sx={{ alignSelf: "flex-end", opacity: 0.7, mt: 0.25, px: isFileMsg ? 1.5 : 0 }}>
                    Edited
                  </Typography>
                )}
              </>
            )}
          </Box>
          {hasReactions && (
            <Reactions message={message} conversation={conversation} meId={user._id} isMine={isMine} onReact={react} />
          )}
        </Box>
        {!isMine && actions}
        {marker && <SeenMarker {...marker} messageId={message._id} />}
      </Stack>
      {footer}
      {statusLabel && (
        <Typography variant="caption" sx={{ alignSelf: "flex-end", color: "text.secondary" }}>
          {statusLabel}
        </Typography>
      )}
      {seenBy?.length > 0 && <SeenByRow people={seenBy} />}
    </Stack>
  );
};

export default MessageContainer;
