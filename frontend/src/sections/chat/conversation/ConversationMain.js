import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { Box, useTheme, Stack } from "@mui/material";
import { useSelector } from "react-redux";
import MessageContainer from "@/sections/chat/messages/MessageContainer";
import { MotionLazyContainer } from "@/components/animate";
import PendingMessageBubble from "@/sections/chat/messages/PendingMessageBubble";
import { scrollToBottom } from "@/utils/scrollToBottom";

// Groups consecutive messages with the same batchId (images only) from the same sender
// into a single display entry with combined files. Documents are never grouped.
const buildDisplayGroups = (messages) => {
  const groups = [];
  let i = 0;
  while (i < messages.length) {
    const msg = messages[i];
    const isImageBatch =
      msg.batchId &&
      msg.files?.some((f) => f.fileType === "image");

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
        const mergedFiles = batch.flatMap((m) => m.files || []);
        const captionMsg = batch.find((m) => m.batchIndex === 0);
        groups.push({
          type: "batch",
          message: {
            ...batch[0],
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

const ConversationMain = () => {
  const theme = useTheme();
  const { user } = useSelector((state) => state.user);
  const { messages, activeConversation, typingConversation, pendingMessages } = useSelector(
    (state) => state.chat
  );

  const peer = activeConversation?.users?.find((member) => member._id !== user._id);
  const [detailsId, setDetailsId] = useState(null);
  const tappedBubble = useRef(null);

  let currentSender = null;

  // Reference to the scrollable element
  const scrollContainerRef = useRef(null);

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
    const hasFiles = msg.files && msg.files.length > 0;
    if (hasFiles && msg.message) return "file_with_caption";
    if (hasFiles) return "file";
    return containsOnlyEmojis(msg.message) ? "emoji" : "text";
  };

  const setTyping = () => {
    const typingObject = typingConversation?.find(
      (obj) => obj.conversation_id === activeConversation?._id
    );
    return typingObject ? typingObject.typing : false;
  };
  // ------------------------------------------

  const isTyping = setTyping();

  // Build display groups for real messages
  const displayGroups = buildDisplayGroups(messages);

  const lastMessage = displayGroups.at(-1)?.message;
  const lastSeenOwnId = displayGroups
    .map((group) => group.message)
    .filter((message) => message.sender._id === user._id && message.seenAt)
    .at(-1)?._id;
  const lastIsOursAndUnseen = lastMessage?.sender._id === user._id && lastMessage._id !== lastSeenOwnId;

  const statusOf = (message) => {
    if (message.awaitingKey) return `Waiting for ${peer.firstName} to open Whisprl`;
    if (message.seenAt) return "Seen";
    return message.deliveredAt ? "Delivered" : "Sent";
  };

  const statusLabelFor = (message) => {
    if (!peer || message.sender._id !== user._id) return null;
    const isLiveStatus = lastIsOursAndUnseen && message._id === lastMessage._id;
    return isLiveStatus || message._id === detailsId ? statusOf(message) : null;
  };

  // a note to self has nobody to read it, so your own photo just marks the latest note
  const markerFor = (message) => {
    if (!peer) return message._id === lastMessage?._id ? { person: user } : null;
    return message._id === lastSeenOwnId ? { person: peer, label: `Seen by ${peer.firstName}` } : null;
  };

  const toggleDetails = (messageId, bubble) => {
    tappedBubble.current = { bubble, top: bubble.getBoundingClientRect().top };
    setDetailsId((openId) => (openId === messageId ? null : messageId));
  };

  // the tapped bubble stays where it was, and what opens around it pushes the rest of the chat instead
  useLayoutEffect(() => {
    if (!tappedBubble.current) return;
    const { bubble, top } = tappedBubble.current;
    tappedBubble.current = null;
    scrollContainerRef.current?.scrollBy({ top: bubble.getBoundingClientRect().top - top, behavior: "instant" });
  }, [detailsId]);

  // Pending messages for the active conversation
  const activePending = pendingMessages.filter(
    (p) => p.convo_id === activeConversation?._id
  );

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollToBottom(scrollContainerRef);
    }
  }, [messages, isTyping, pendingMessages]);

  return (
    <Box
      width="100%"
      pl={4}
      pr={2.2}
      py={1}
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        overflowY: "scroll",
        backgroundColor: theme.palette.background.paper,
        scrollBehavior: "smooth",
      }}
      className="scrollbar"
      ref={scrollContainerRef}
    >
      <MotionLazyContainer>
        <MotionConfig reducedMotion="user">
          <Stack spacing={0.5} sx={{ mt: "auto" }}>
            {displayGroups.map((group, index) => {
              const message = group.message;

              const isStartOfSequence =
                currentSender === null || message.sender._id !== currentSender;

              const nextGroup = displayGroups[index + 1];
              const isEndOfSequence =
                !nextGroup ||
                message.sender._id !== nextGroup.message.sender._id ||
                containsOnlyEmojis(message.message) ||
                (nextGroup && containsOnlyEmojis(nextGroup.message.message));

              currentSender = message.sender._id;

              return (
                <MessageContainer
                  key={message._id}
                  message={message}
                  me={user._id === message.sender._id}
                  isStartOfSequence={isStartOfSequence}
                  isEndOfSequence={isEndOfSequence}
                  msgType={getMessageType(message)}
                  showTime={detailsId === message._id}
                  statusLabel={statusLabelFor(message)}
                  marker={markerFor(message)}
                  onToggleDetails={(bubble) => toggleDetails(message._id, bubble)}
                />
              );
            })}

            {/* Pending upload bubbles */}
            {activePending.map((pending) => (
              <PendingMessageBubble key={pending.localId} pending={pending} />
            ))}

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
  );
};

export default ConversationMain;
