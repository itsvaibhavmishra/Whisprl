import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { Box, Button, CircularProgress, Divider, Stack, Typography, useTheme } from "@mui/material";
import { ArrowDown } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import MessageContainer from "@/sections/chat/messages/MessageContainer";
import { MotionLazyContainer } from "@/components/animate";
import { DidNotUpload, NotSent } from "@/sections/chat/messages/MessageProblems";
import { useChatScroll } from "@/sections/chat/conversation/useChatScroll";
import { LoadOlderMessages } from "@/redux/slices/actions/chatActions";
import { selectActiveOutbox } from "@/redux/slices/chatSlice";
import { filesOf } from "@/utils/messageFiles";
import useIsLoading from "@/hooks/useIsLoading";

// Groups consecutive messages with the same batchId (images only) from the same sender
// into a single display entry with combined files. Documents are never grouped.
const buildDisplayGroups = (messages) => {
  const groups = [];
  let i = 0;
  while (i < messages.length) {
    const msg = messages[i];
    const isImageBatch = msg.batchId && filesOf(msg).some((file) => file.fileType === "image");

    if (isImageBatch) {
      const batch = [msg];
      let j = i + 1;
      while (
        j < messages.length &&
        messages[j].batchId === msg.batchId &&
        messages[j].sender?._id === msg.sender?._id
      ) {
        batch.push(messages[j]);
        j++;
      }

      if (batch.length > 1) {
        // Merge all files into the lead message; use caption from batchIndex 0
        const mergedFiles = batch.flatMap(filesOf);
        const captionMsg = batch.find((m) => m.batchIndex === 0);
        groups.push({
          type: "batch",
          members: batch,
          message: {
            ...batch[0],
            file: undefined,
            files: mergedFiles,
            message: captionMsg?.message || "",
          },
        });
      } else {
        groups.push({ type: "single", message: msg });
      }
      i = j;
    } else {
      groups.push({ type: "single", message: msg });
      i++;
    }
  }
  return groups;
};

const keyOf = (message) => message.clientId ?? message._id;

const UNREAD_DIVIDER = "unread-divider";

const queuedMessage = (entry, me) => ({
  _id: entry.clientId,
  clientId: entry.clientId,
  sender: me,
  message: entry.text ?? entry.caption ?? "",
  createdAt: entry.createdAt,
  file: entry.file,
  attachment: entry.file && { status: "uploading" },
  outboxEntry: entry,
});

// a failed message stays where it was written, and one still sending is the newest there is
const withQueued = (messages, outbox, me) => {
  const loaded = new Set(messages.map((message) => message._id));
  const failedAfter = new Map();
  const sending = [];

  outbox.forEach((entry) => {
    const anchor = entry.afterId ?? null;
    if (entry.status !== "failed" || (anchor && !loaded.has(anchor))) return sending.push(queuedMessage(entry, me));
    failedAfter.set(anchor, [...(failedAfter.get(anchor) ?? []), queuedMessage(entry, me)]);
  });

  return [
    ...(failedAfter.get(null) ?? []),
    ...messages.flatMap((message) => [message, ...(failedAfter.get(message._id) ?? [])]),
    ...sending,
  ];
};

const itemTypeOf = (group) => (group.message.outboxEntry ? "queued" : group.type);

const ConversationMain = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const isLoadingOlder = useIsLoading(LoadOlderMessages);
  const { messages, activeConversation, typingConversation, hasOlderMessages, unreadMarker } = useSelector(
    (state) => state.chat
  );
  const outbox = useSelector(selectActiveOutbox);

  const peer = activeConversation?.users?.find((member) => member._id !== user._id);
  const [detailsId, setDetailsId] = useState(null);

  let currentSender = null;

  // -------------- inner functions --------------
  const containsOnlyEmojis = (text) => {
    if (!text) return false;
    const emojiRegex =
      /[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const emojiStatus = [...text].every((char) => emojiRegex.test(char));
    if (emojiStatus) {
      currentSender = null;
    }
    return emojiStatus;
  };

  const getMessageType = (msg) => {
    const hasFiles = filesOf(msg).length > 0;
    if (hasFiles && msg.message) return "file_with_caption";
    if (hasFiles) return "file";
    return containsOnlyEmojis(msg.message) ? "emoji" : "text";
  };

  const isTyping = Boolean(
    typingConversation?.find((obj) => obj.conversation_id === activeConversation?._id)?.typing
  );
  // ------------------------------------------

  const items = buildDisplayGroups(withQueued(messages, outbox, user)).map((group) => ({
    ...group,
    type: itemTypeOf(group),
    entry: group.message.outboxEntry,
  }));
  const confirmed = items.filter((item) => !item.entry);

  const lastConfirmed = confirmed.at(-1)?.message;
  const lastItem = items.at(-1);
  const lastSeenOwnId = confirmed
    .map((group) => group.message)
    .filter((message) => message.sender._id === user._id && message.seenAt)
    .at(-1)?._id;
  const lastIsOursAndUnseen =
    lastItem?.message.sender._id === user._id && lastItem.message._id !== lastSeenOwnId;

  const statusOf = (message) => {
    if (message.awaitingKey) return `Waiting for ${peer.firstName} to open Whisprl`;
    if (message.seenAt) return "Seen";
    return message.deliveredAt ? "Delivered" : "Sent";
  };

  const statusLabelFor = (item) => {
    const { message } = item;
    if (item.type === "queued") return item.entry.status === "sending" && item === lastItem ? "Sending…" : null;
    if (!peer || message.sender._id !== user._id) return null;
    const isLiveStatus = lastIsOursAndUnseen && item === lastItem;
    return isLiveStatus || message._id === detailsId ? statusOf(message) : null;
  };

  // a note to self has nobody to read it, so your own photo just marks the latest note
  const markerFor = (message) => {
    if (!peer) return message._id === lastConfirmed?._id ? { person: user } : null;
    return message._id === lastSeenOwnId ? { person: peer, label: `Seen by ${peer.firstName}` } : null;
  };

  const loadOlder = useCallback(() => dispatch(LoadOlderMessages()), [dispatch]);

  const { scrollRef, contentRef, topRef, handleScroll, holdStill, jumpToLatest, isAwayFromBottom } = useChatScroll({
    conversationId: activeConversation?._id,
    openAtKey: unreadMarker && UNREAD_DIVIDER,
    contentVersion: `${items.length}:${lastItem && keyOf(lastItem.message)}:${isTyping}:${detailsId}:${lastItem ? statusLabelFor(lastItem) : ""}`,
    firstMessageId: messages[0]?._id,
    canLoadOlder: hasOlderMessages && !isLoadingOlder,
    onLoadOlder: loadOlder,
  });

  const toggleDetails = (message) => {
    holdStill(keyOf(message));
    setDetailsId((openId) => (openId === message._id ? null : message._id));
  };

  // a group of photos shows as one bubble, but each photo uploads, and can fail, on its own
  const footerFor = (item) => {
    if (item.entry) return item.entry.status === "failed" ? <NotSent entry={item.entry} /> : undefined;
    const ownUploads = (item.members ?? [item.message]).filter(
      (message) => message.sender._id === user._id && message.attachment?.status === "uploading"
    );
    return ownUploads.length ? ownUploads.map((message) => <DidNotUpload key={message._id} message={message} />) : undefined;
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

  return (
    <Box sx={{ position: "relative", flexGrow: 1, minHeight: 0, display: "flex" }}>
      <Box
        width="100%"
        pl={4}
        pr={2.2}
        py={1}
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar"
        sx={{
          display: "flex",
          flexDirection: "column",
          overflowY: "scroll",
          overflowAnchor: "none",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <MotionLazyContainer>
          <MotionConfig reducedMotion="user">
            <Stack ref={contentRef} spacing={0.5} sx={{ mt: "auto" }}>
              <Box ref={topRef} sx={{ display: "flex", justifyContent: "center", minHeight: 24, py: 1 }}>
                {isLoadingOlder && <CircularProgress size={20} aria-label="Loading older messages" />}
                {!hasOlderMessages && messages.length > 0 && (
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    This is the start of your conversation
                  </Typography>
                )}
              </Box>

              {items.map((item, index) => {
                const { message } = item;

                const isStartOfSequence =
                  currentSender === null || message.sender._id !== currentSender;

                const nextItem = items[index + 1];
                const isEndOfSequence =
                  !nextItem ||
                  message.sender._id !== nextItem.message.sender._id ||
                  containsOnlyEmojis(message.message) ||
                  containsOnlyEmojis(nextItem.message.message);

                currentSender = message.sender._id;

                const divider = message._id === unreadMarker?.firstId && (
                  <Divider data-message-key={UNREAD_DIVIDER} sx={{ my: 1, typography: "caption", color: "text.secondary" }}>
                    {unreadMarker.count} unread message{unreadMarker.count === 1 ? "" : "s"}
                  </Divider>
                );

                return (
                  <Fragment key={keyOf(message)}>
                    {divider}
                    <MessageContainer
                      anchorKey={keyOf(message)}
                      message={message}
                      me={user._id === message.sender._id}
                      isQueued={item.type === "queued"}
                      isStartOfSequence={isStartOfSequence}
                      isEndOfSequence={isEndOfSequence}
                      msgType={getMessageType(message)}
                      showTime={detailsId === message._id}
                      statusLabel={statusLabelFor(item)}
                      footer={footerFor(item)}
                      marker={item.type === "queued" ? null : markerFor(message)}
                      onToggleDetails={tapHandlerFor(item)}
                    />
                  </Fragment>
                );
              })}

              {isTyping && (
                <MessageContainer
                  message={{ message: "Typing" }}
                  me={false}
                  isStartOfSequence={true}
                  isEndOfSequence={true}
                  msgType={"typing"}
                  isTyping={isTyping}
                />
              )}
            </Stack>
          </MotionConfig>
        </MotionLazyContainer>
      </Box>

      {isAwayFromBottom && (
        <Button
          size="small"
          variant="contained"
          startIcon={<ArrowDown size={16} />}
          onClick={jumpToLatest}
          sx={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", borderRadius: 20 }}
        >
          {missed ? `${missed} new message${missed === 1 ? "" : "s"}` : "Jump to latest"}
        </Button>
      )}
    </Box>
  );
};

export default ConversationMain;
