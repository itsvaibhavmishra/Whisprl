import { Stack, Box, useTheme, Typography } from "@mui/material";
import BeatLoader from "react-spinners/BeatLoader";

import getAvatar from "@/utils/createAvatar";
import ImageMessage from "@/sections/chat/messages/ImageMessage";
import DocumentMessage from "@/sections/chat/messages/DocumentMessage";
import SeenMarker from "@/sections/chat/messages/SeenMarker";
import { formatMessageTime } from "@/utils/formatMessageTime";
import { filesOf } from "@/utils/messageFiles";

const UNREADABLE = "This message can't be opened on this device";
const WAITING = "This message arrives when the sender is next online";

const MessageContainer = ({
  anchorKey,
  message,
  me,
  isQueued,
  isStartOfSequence,
  isEndOfSequence,
  msgType,
  isTyping,
  showTime,
  statusLabel,
  footer,
  marker,
  onToggleDetails,
}) => {
  const theme = useTheme();

  let borderRadiusStyle;

  if (isStartOfSequence && isEndOfSequence) {
    borderRadiusStyle = "20px";
  } else if (me && isStartOfSequence) {
    borderRadiusStyle = "20px 20px 5px 20px";
  } else if (me && isEndOfSequence) {
    borderRadiusStyle = "20px 5px 20px 20px";
  } else if (me) {
    borderRadiusStyle = "20px 5px 5px 20px";
  } else if (!me && isStartOfSequence) {
    borderRadiusStyle = "20px 20px 20px 5px";
  } else if (!me && isEndOfSequence) {
    borderRadiusStyle = "5px 20px 20px 20px";
  } else {
    borderRadiusStyle = "5px 20px 20px 5px";
  }

  const files = filesOf(message);
  const hasImages = files.some((file) => file.fileType === "image");
  const hasDocs = files.some((file) => file.fileType === "document");
  const isFileMsg = msgType === "file" || msgType === "file_with_caption";
  const hasCaption = isFileMsg && Boolean(message.message);

  // For image messages: no padding on the bubble (images clip to border-radius)
  // Caption is rendered with px inside after images
  const bubblePadding = isFileMsg
    ? hasImages
      ? 0 // images clip flush; caption gets its own padding below
      : 1  // doc-only: small padding
    : msgType === "text"
    ? 1.5
    : "3px 0px"; // emoji

  const bubbleBg =
    msgType === "typing"
      ? theme.palette.background.default
      : msgType === "emoji"
      ? "transparent"
      : me
      ? theme.palette.primary.main
      : theme.palette.background.default;

  const toggleProps = onToggleDetails && {
    onClick: (event) => {
      if (!event.target.closest("img, a, button")) onToggleDetails(event.currentTarget);
    },
    ...(!isFileMsg && {
      role: "button",
      tabIndex: 0,
      "aria-expanded": Boolean(showTime),
      onKeyDown: (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onToggleDetails(event.currentTarget);
      },
    }),
  };

  return (
    <Stack spacing={0.5}>
      {showTime && (
        <Typography variant="caption" sx={{ alignSelf: "center", color: "text.secondary" }}>
          {formatMessageTime(message.createdAt)}
        </Typography>
      )}
      <Stack
        direction="row"
        data-message-key={anchorKey}
        justifyContent={me ? "flex-end" : "flex-start"}
        alignItems="center"
        sx={{ position: "relative", opacity: isQueued ? 0.7 : 1 }}
      >
        {!me && isEndOfSequence && !isTyping && (
          <Box
            sx={{
              position: "absolute",
              top: msgType === "text" || isFileMsg ? 10 : 18,
              left: -25,
            }}
          >
            {getAvatar(
              message?.sender?.avatar,
              message?.sender?.firstName,
              theme,
              20
            )}
          </Box>
        )}
        <Box
          p={bubblePadding}
          {...toggleProps}
          sx={{
            cursor: onToggleDetails ? "pointer" : "default",
            display: "flex",
            flexDirection: "column",
            width: isFileMsg ? "auto" : "max-content",
            minWidth: 40,
            maxWidth: { xs: "14em", md: "20em" },
            minHeight: 40,
            backgroundColor: bubbleBg,
            borderRadius: borderRadiusStyle,
            overflow: "hidden",
          }}
        >
          {msgType === "typing" && isTyping ? (
            <BeatLoader
              size={5}
              height={0.5}
              width={1}
              color={theme.palette.primary.main}
              speedMultiplier={0.5}
              margin={2}
            />
          ) : (
            <>
              {/* Render image attachments */}
              {hasImages && <ImageMessage files={files} />}

              {/* Render document attachments */}
              {hasDocs && (
                <Box sx={{ mt: hasImages ? 0.5 : 0 }}>
                  <DocumentMessage files={files} />
                </Box>
              )}

              {/* Render caption / text */}
              {(message.message || message.undecryptable) && (
                <Typography
                  variant={!isFileMsg && msgType === "emoji" ? "h3" : "body2"}
                  color={me ? "#fff" : theme.palette.text.primary}
                  sx={{
                    whiteSpace: "preserve",
                    wordBreak: "break-word",
                    ...(message.undecryptable && { fontStyle: "italic", opacity: 0.75 }),
                    ...(isFileMsg && hasCaption && {
                      px: 1.5,
                      pb: 1,
                      pt: 0.5,
                    }),
                  }}
                >
                  {message.undecryptable ? (message.awaitingKey ? WAITING : UNREADABLE) : message.message}
                </Typography>
              )}
            </>
          )}
        </Box>
        {marker && <SeenMarker {...marker} messageId={message._id} />}
      </Stack>
      {footer}
      {statusLabel && (
        <Typography variant="caption" sx={{ alignSelf: "flex-end", color: "text.secondary" }}>
          {statusLabel}
        </Typography>
      )}
    </Stack>
  );
};

export default MessageContainer;
