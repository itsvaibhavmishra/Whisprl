import { useEffect, useRef } from "react";
import { Box, useTheme, Stack } from "@mui/material";
import { useSelector } from "react-redux";
import MessageContainer from "./ConvoSubElements/MessageContainer";
import PendingMessageBubble from "./ConvoSubElements/PendingMessageBubble";
import { scrollToBottom } from "../../../../utils/scrollToBottom";

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
        overflowY: "scroll",
        backgroundColor: theme.palette.background.paper,
        scrollBehavior: "smooth",
      }}
      className="scrollbar"
      ref={scrollContainerRef}
    >
      <Stack spacing={0.5}>
        {displayGroups.map((group, index) => {
          const e = group.message;

          const isStartOfSequence =
            currentSender === null || e.sender._id !== currentSender;

          const nextGroup = displayGroups[index + 1];
          const isEndOfSequence =
            !nextGroup ||
            e.sender._id !== nextGroup.message.sender._id ||
            containsOnlyEmojis(e.message) ||
            (nextGroup && containsOnlyEmojis(nextGroup.message.message));

          currentSender = e.sender._id;

          const isLastMessage = index === displayGroups.length - 1 && activePending.length === 0;

          return (
            <MessageContainer
              key={e._id}
              message={e}
              me={user._id === e.sender._id}
              isStartOfSequence={isStartOfSequence}
              isEndOfSequence={isEndOfSequence}
              msgType={getMessageType(e)}
              isLastMessage={isLastMessage}
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
            isLastMessage={true}
            isTyping={isTyping}
          />
        )}
      </Stack>
    </Box>
  );
};

export default ConversationMain;
