import { Stack, Box, useTheme, Typography } from "@mui/material";
import BeatLoader from "react-spinners/BeatLoader";

import getAvatar from "../../../../../utils/createAvatar";
import ImageMessage from "./ImageMessage";
import DocumentMessage from "./DocumentMessage";

const MessageContainer = ({
  message,
  me,
  isStartOfSequence,
  isEndOfSequence,
  msgType,
  isLastMessage,
  isTyping,
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

  const hasFiles = message.files && message.files.length > 0;
  const hasImages = hasFiles && message.files.some((f) => f.fileType === "image");
  const hasDocs = hasFiles && message.files.some((f) => f.fileType === "document");
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

  return (
    <Stack
      direction="row"
      justifyContent={me ? "flex-end" : "flex-start"}
      alignItems="center"
      sx={{ position: "relative" }}
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
        sx={{
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
            {hasImages && <ImageMessage files={message.files} />}

            {/* Render document attachments */}
            {hasDocs && (
              <Box sx={{ mt: hasImages ? 0.5 : 0, p: hasDocs && !hasImages ? 0 : 0 }}>
                <DocumentMessage files={message.files} />
              </Box>
            )}

            {/* Render caption / text */}
            {message.message && (
              <Typography
                variant={!isFileMsg && msgType === "emoji" ? "h3" : "body2"}
                color={me ? "#fff" : theme.palette.text.primary}
                sx={{
                  whiteSpace: "preserve",
                  wordBreak: "break-word",
                  ...(isFileMsg && hasCaption && {
                    px: 1.5,
                    pb: 1,
                    pt: 0.5,
                  }),
                }}
              >
                {message.message}
              </Typography>
            )}
          </>
        )}
      </Box>
      {me && isLastMessage && (
        <Box
          sx={{
            position: "absolute",
            top: 25,
            right: -16,
          }}
        >
          {getAvatar(
            message?.sender?.avatar,
            message?.sender?.firstName,
            theme,
            15
          )}
        </Box>
      )}
    </Stack>
  );
};

export default MessageContainer;
