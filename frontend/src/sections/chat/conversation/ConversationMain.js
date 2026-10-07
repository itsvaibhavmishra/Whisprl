import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Badge, Box, CircularProgress, Divider, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowDown, LockSimple } from "phosphor-react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";

import MessageContainer from "@/sections/chat/messages/MessageContainer";
import { DidNotUpload, NotSent } from "@/sections/chat/messages/MessageProblems";
import { useChatScroll } from "@/sections/chat/conversation/useChatScroll";
import { floatingDayLabelStyles, useFloatingDayLabels } from "@/sections/chat/conversation/useFloatingDayLabels";
import { UNREAD_DIVIDER, displayItemsOf, keyOf, lastIdOf } from "@/sections/chat/conversation/displayItems";
import { GetMessages, LoadNewerMessages, LoadOlderMessages } from "@/redux/slices/actions/chatActions";
import { RevealMessage } from "@/redux/slices/actions/messageActions";
import { focusMessage, selectActiveOutbox } from "@/redux/slices/chatSlice";
import ChatNote from "@/sections/chat/conversation/ChatNote";
import { notify } from "@/utils/notify";
import { formatDayLabel } from "@/utils/formatMessageTime";
import { filesOf } from "@/utils/messageFiles";
import { describeEvent, typingNamesIn } from "@/utils/groups";
import TypingBubble, { TYPING_BUBBLE_HEIGHT } from "@/sections/chat/messages/TypingBubble";
import useIsLoading from "@/hooks/useIsLoading";

const EMOJI = /[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

const isOnlyEmoji = (text) => Boolean(text) && [...text].every((char) => EMOJI.test(char));

const messageTypeOf = (message) => {
  const hasFiles = filesOf(message).length > 0;
  if (hasFiles && message.message) return "file_with_caption";
  if (hasFiles) return "file";
  return isOnlyEmoji(message.message) ? "emoji" : "text";
};

// an event or a lone emoji stands apart, so the bubbles either side of it start or end a run
const joinsRun = (item) => Boolean(item) && item.type !== "event" && !isOnlyEmoji(item.message.message);

const dayOf = (message) => new Date(message.createdAt).toDateString();

const DayLabel = ({ children }) => (
  <Box data-day-label sx={{ position: "sticky", top: 10, zIndex: 2, alignSelf: "center", my: 1, pointerEvents: "none" }}>
    <Typography
      component="p"
      sx={{
        px: 1.5,
        py: 0.5,
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 700,
        color: "text.secondary",
        bgcolor: "chat.pill",
        transition: "background-color 240ms ease, box-shadow 240ms ease",
      }}
    >
      {children}
    </Typography>
  </Box>
);

export const MESSAGE_COLUMN_WIDTH = 860;
export const MESSAGES_ID = "chat-messages";
export const MATCH_HIGHLIGHT = "chat-search";

const ConversationMain = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const isLoadingOlder = useIsLoading(LoadOlderMessages);
  const { messages, activeConversation, typingConversation, hasOlderMessages, hasNewerMessages, unreadMarker, focusedMessageId, hasFetched } = useSelector(
    ({ chat }) => ({
      messages: chat.messages,
      activeConversation: chat.activeConversation,
      typingConversation: chat.typingConversation,
      hasOlderMessages: chat.hasOlderMessages,
      hasNewerMessages: chat.hasNewerMessages,
      unreadMarker: chat.unreadMarker,
      focusedMessageId: chat.focusedMessageId,
      hasFetched: chat.hasFetched,
    }),
    shallowEqual,
  );
  const isLoadingNewer = useIsLoading(LoadNewerMessages);
  const outbox = useSelector(selectActiveOutbox);

  const isGroup = Boolean(activeConversation?.isGroup);
  const others = activeConversation?.users?.filter((member) => member._id !== user._id) ?? [];
  const peer = isGroup ? undefined : others[0];
  const [detailsId, setDetailsId] = useState(null);

  const typists = typingNamesIn(activeConversation, typingConversation, user._id);

  const items = displayItemsOf(messages, outbox, user);
  const confirmed = items.filter((item) => !item.entry);

  // only a message arriving at the newest end rises in, so opening a chat or loading history never animates
  const known = useRef({ keys: null, wasShowingLatest: false });
  const { keys: knownKeys, wasShowingLatest } = known.current;
  const lastKnownIndex = knownKeys ? items.findLastIndex((item) => knownKeys.has(keyOf(item.message))) : -1;
  const canRise = Boolean(knownKeys) && (lastKnownIndex >= 0 || knownKeys.size === 0) && wasShowingLatest && !hasNewerMessages;

  useEffect(() => {
    if (hasFetched || items.length) known.current = { keys: new Set(items.map((item) => keyOf(item.message))), wasShowingLatest: !hasNewerMessages };
  });

  const days = items.reduce((groups, item, index) => {
    const day = dayOf(item.message);
    if (groups.at(-1)?.day !== day) {
      const repeats = groups.filter((group) => group.day === day).length;
      groups.push({ day, key: `${day}#${repeats}`, label: formatDayLabel(item.message.createdAt), entries: [] });
    }
    groups.at(-1).entries.push({ item, index });
    return groups;
  }, []);

  const lastConfirmed = confirmed.at(-1)?.message;
  const lastItem = items.at(-1);
  const lastSeenOwnId = confirmed
    .map((group) => group.message)
    .filter((message) => message.sender._id === user._id && message.seenAt)
    .at(-1)?._id;
  const readersOf = (item) => others.filter((member) => (activeConversation.lastSeen?.[member._id] ?? "") >= lastIdOf(item));
  const isSeen = (item) => (isGroup ? readersOf(item).length > 0 : item.message._id === lastSeenOwnId);
  const lastIsOursAndUnseen = lastItem?.type !== "event" && lastItem?.message.sender._id === user._id && !isSeen(lastItem);

  const statusOf = (item) => {
    const { message } = item;
    if (isGroup) return isSeen(item) ? `Seen by ${readersOf(item).length}` : "Sent";
    if (message.awaitingKey) return `Waiting for ${peer.firstName} to open Whisprl`;
    if (message.seenAt) return "Seen";
    return message.deliveredAt ? "Delivered" : "Sent";
  };

  const statusLabelFor = (item) => {
    if (item.type === "queued") return item.entry.status !== "failed" && item === lastItem ? "Sending…" : null;
    if (item.message.isEditPending) return "Sending…";
    if ((!peer && !isGroup) || item.message.sender._id !== user._id) return null;
    // in a one-to-one chat the ticks already say this, so only a message still waiting on a key is spelled out
    const isLiveStatus = lastIsOursAndUnseen && item === lastItem && (isGroup || item.message.awaitingKey);
    return isLiveStatus || item.message._id === detailsId ? statusOf(item) : null;
  };

  // a note to self has nobody to read it, so your own photo just marks the latest note
  const markerFor = (message) => {
    if (isGroup) return null;
    if (!peer) return message._id === lastConfirmed?._id ? { person: user } : null;
    return message._id === lastSeenOwnId ? { person: peer, label: `Seen by ${peer.firstName}` } : null;
  };

  // each member's photo sits under the newest message they have read, unless they wrote it
  const seenRows = new Map();
  if (isGroup) {
    const readable = confirmed.filter((item) => item.type !== "event");
    others.forEach((member) => {
      const pointer = activeConversation.lastSeen?.[member._id];
      const item = pointer && readable.findLast((candidate) => lastIdOf(candidate) <= pointer);
      if (item && item.message.sender._id !== member._id) seenRows.set(item, [...(seenRows.get(item) ?? []), member]);
    });
  }

  const loadOlder = useCallback(() => dispatch(LoadOlderMessages()), [dispatch]);
  const loadNewer = useCallback(() => dispatch(LoadNewerMessages()), [dispatch]);

  const { scrollRef, contentRef, topRef, bottomRef, handleScroll, holdStill, jumpToLatest, scrollToKey, isAwayFromBottom } = useChatScroll({
    conversationId: activeConversation?._id,
    openAtKey: unreadMarker && UNREAD_DIVIDER,
    contentVersion: `${items.length}:${lastItem && keyOf(lastItem.message)}:${detailsId}:${lastItem ? statusLabelFor(lastItem) : ""}`,
    firstMessageId: messages[0]?._id,
    lastMessageId: messages.at(-1)?._id,
    canLoadOlder: hasOlderMessages && !isLoadingOlder,
    onLoadOlder: loadOlder,
    canLoadNewer: hasNewerMessages && !isLoadingNewer,
    onLoadNewer: loadNewer,
    isShowingLatest: !hasNewerMessages,
  });
  useFloatingDayLabels(scrollRef);

  // from an older stretch the latest page is fetched first, since everything between was never loaded
  const goToLatest = async () => {
    if (hasNewerMessages) await dispatch(GetMessages(activeConversation._id));
    requestAnimationFrame(jumpToLatest);
  };

  // the jump finishes after older pages load, so it reads the newest messages and scroll position through refs
  const [highlightedId, setHighlightedId] = useState(null);
  const latest = useRef({});
  latest.current = { messages, scrollToKey };

  useEffect(() => {
    if (!focusedMessageId) return;
    dispatch(RevealMessage(focusedMessageId)).then((isLoaded) => {
      dispatch(focusMessage(null));
      const target = latest.current.messages.find((message) => message._id === focusedMessageId);
      if (!isLoaded || !target) return notify({ severity: "info", message: "That message is no longer in this chat" });
      requestAnimationFrame(() => {
        latest.current.scrollToKey(keyOf(target));
        setHighlightedId(focusedMessageId);
      });
    });
  }, [focusedMessageId, dispatch]);

  useEffect(() => {
    if (!highlightedId) return;
    const timer = setTimeout(() => setHighlightedId(null), 1800);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  const jumpTo = (messageId) => dispatch(focusMessage(messageId));

  const toggleDetails = (message) => {
    holdStill(keyOf(message));
    setDetailsId((openId) => (openId === message._id ? null : message._id));
  };

  // a group of photos and videos shows as one bubble, but each file sends, and can fail, on its own
  const footerFor = (item) => {
    const members = item.members ?? [item.message];
    const notSent = members
      .filter((message) => message.outboxEntry?.status === "failed")
      .map((message) => <NotSent key={message._id} entry={message.outboxEntry} />);
    const didNotUpload = members
      .filter((message) => !message.outboxEntry && message.sender._id === user._id && message.attachment?.status === "uploading")
      .map((message) => <DidNotUpload key={message._id} message={message} />);
    const problems = [...notSent, ...didNotUpload];
    return problems.length ? problems : undefined;
  };

  const tapHandlerFor = (item) => (item.type === "queued" ? undefined : () => toggleDetails(item.message));

  // counts what arrives from others while the reader is scrolled up, so the jump button can say what they missed
  const [missed, setMissed] = useState(0);
  const lastArrival = confirmed.filter((item) => item.message.sender._id !== user._id).at(-1)?.message._id;
  const countedArrival = useRef({ conversationId: null, messageId: null });

  useEffect(() => {
    const counted = countedArrival.current;
    const isNewArrival = counted.conversationId === activeConversation?._id && counted.messageId !== lastArrival;
    if (isNewArrival && isAwayFromBottom) setMissed((count) => count + 1);
    countedArrival.current = { conversationId: activeConversation?._id, messageId: lastArrival };
  }, [activeConversation?._id, lastArrival, isAwayFromBottom]);

  useEffect(() => {
    if (!isAwayFromBottom) setMissed(0);
  }, [isAwayFromBottom]);

  const jumpLabel = missed ? `${missed} new message${missed === 1 ? "" : "s"}` : "Jump to latest";

  return (
    <Box sx={{ position: "relative", flex: "1 1 0", minHeight: 0, display: "flex" }}>
      <Box
        width="100%"
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar"
        sx={{
          display: "flex",
          flexDirection: "column",
          overflowY: "scroll",
          overflowAnchor: "none",
          pl: 7,
          pr: { xs: 2.5, md: 4 },
          pt: 1,
          pb: 0.5,
          ...floatingDayLabelStyles,
          [`& ::highlight(${MATCH_HIGHLIGHT})`]: { backgroundColor: (theme) => alpha(theme.palette.primary.glow, 0.45), color: "inherit" },
          [`& [data-own] ::highlight(${MATCH_HIGHLIGHT})`]: { backgroundColor: "rgba(255, 255, 255, 0.92)", color: "#0A3D73" },
        }}
      >
        <Stack ref={contentRef} id={MESSAGES_ID} spacing={0.5} useFlexGap sx={{ mt: "auto", width: "100%", maxWidth: MESSAGE_COLUMN_WIDTH, mx: "auto" }}>
          <Box ref={topRef} sx={{ display: "flex", justifyContent: "center", minHeight: 24, py: 1 }}>
            {isLoadingOlder && <CircularProgress size={20} aria-label="Loading older messages" />}
            {!hasOlderMessages && messages.length > 0 && (
              <ChatNote sx={{ maxWidth: 340, px: 1.75, py: 1.25, borderRadius: 1.5, fontSize: 12.5, lineHeight: 1.5 }}>
                <LockSimple size={14} weight="bold" aria-hidden style={{ verticalAlign: "-2px", marginRight: 6 }} />
                Messages here are end-to-end encrypted. Only the people in this chat can read them.
              </ChatNote>
            )}
          </Box>

          {days.map(({ key, label, entries }) => (
            <Stack key={key} spacing={0.5} useFlexGap>
              <DayLabel>{label}</DayLabel>
              {entries.map(({ item, index }, position) => {
                const { message } = item;

                const unreadLine = message._id === unreadMarker?.firstId && (
                  <Divider
                    data-message-key={UNREAD_DIVIDER}
                    role="presentation"
                    sx={{
                      my: 1,
                      "&::before, &::after": { borderColor: "primary.main", opacity: 0.4 },
                      "& .MuiDivider-wrapper": { mx: 1.5, px: 1.5, py: 0.5, borderRadius: 99, fontSize: 12, fontWeight: 800, color: "primary.main", bgcolor: "chat.pill" },
                    }}
                  >
                    {unreadMarker.count} unread message{unreadMarker.count === 1 ? "" : "s"}
                  </Divider>
                );

                if (item.type === "event") {
                  return (
                    <Fragment key={keyOf(message)}>
                      {unreadLine}
                      <ChatNote data-message-key={keyOf(message)}>
                        {describeEvent(message, activeConversation, user._id)}
                      </ChatNote>
                    </Fragment>
                  );
                }

                // a run of bubbles ends with its day, since the day label sits between them
                const previousItem = entries[position - 1]?.item;
                const nextItem = entries[position + 1]?.item;
                const isStartOfSequence = !joinsRun(previousItem) || previousItem.message.sender._id !== message.sender._id;
                const isEndOfSequence =
                  !joinsRun(nextItem) || nextItem.message.sender._id !== message.sender._id || isOnlyEmoji(message.message);
                const isMine = user._id === message.sender._id;

                return (
                  <Fragment key={keyOf(message)}>
                    {unreadLine}
                    <MessageContainer
                      anchorKey={keyOf(message)}
                      message={message}
                      me={isMine}
                      conversation={activeConversation}
                      isHighlighted={highlightedId === message._id}
                      isFresh={canRise && index > lastKnownIndex}
                      onJumpTo={jumpTo}
                      onHoldStill={holdStill}
                      senderName={isGroup && !isMine && isStartOfSequence ? message.sender.firstName : undefined}
                      seenBy={seenRows.get(item)}
                      isQueued={item.type === "queued"}
                      isStartOfSequence={isStartOfSequence}
                      startsTurn={isStartOfSequence && Boolean(previousItem) && previousItem.type !== "event"}
                      isEndOfSequence={isEndOfSequence}
                      msgType={messageTypeOf(message)}
                      showTime={detailsId === message._id}
                      statusLabel={statusLabelFor(item)}
                      footer={footerFor(item)}
                      marker={item.type === "queued" ? null : markerFor(message)}
                      onToggleDetails={tapHandlerFor(item)}
                    />
                  </Fragment>
                );
              })}
            </Stack>
          ))}

          {/* the typing bubble has a slot of its own, so it comes and goes without moving the messages */}
          <Box sx={{ minHeight: TYPING_BUBBLE_HEIGHT }}>
            {typists.length > 0 && !hasNewerMessages && <TypingBubble names={typists} isGroup={isGroup} />}
          </Box>
          <Box ref={bottomRef} sx={{ display: "flex", justifyContent: "center", minHeight: "1px" }}>
            {isLoadingNewer && <CircularProgress size={20} aria-label="Loading newer messages" />}
          </Box>
        </Stack>
      </Box>

      {(isAwayFromBottom || hasNewerMessages) && (
        <Tooltip title={jumpLabel} placement="left">
          <IconButton
            onClick={goToLatest}
            aria-label={jumpLabel}
            sx={{
              position: "absolute",
              right: { xs: 12, md: 24 },
              bottom: 12,
              width: 44,
              height: 44,
              color: "text.primary",
              bgcolor: "chat.raised",
              boxShadow: (theme) => `0 6px 20px -6px ${theme.palette.chat.shade}, 0 0 0 1px ${theme.palette.divider}`,
              "&:hover": { bgcolor: "chat.raised", color: "primary.main" },
            }}
          >
            <Badge
              badgeContent={missed}
              color="primary"
              sx={{ "& .MuiBadge-badge": { top: -10, right: -10, fontWeight: 800 } }}
            >
              <ArrowDown size={20} weight="bold" />
            </Badge>
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default ConversationMain;
