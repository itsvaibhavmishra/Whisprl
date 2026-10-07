import { Avatar, Badge, Box, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { PaperPlaneRight } from "phosphor-react";

import whisprlFace from "@/assets/icons/logo/WhisprlAvatar.webp";
import TypingDots from "@/components/TypingDots";
import { CONVERSATION } from "@/sections/welcome/content";
import { NO_MOTION } from "@/sections/welcome/styles";
import { gradientOf } from "@/utils/gradients";

const FIRST_MESSAGE_AT = 400;
const PAUSE_BEFORE_TYPING = 500;
const TYPING_FOR = 1300;
const PAUSE_BEFORE_NEXT_QUESTION = 800;

// When each message lands, and for a reply how long the typing dots run before it.
const scheduleConversation = (messages) => {
  let clock = FIRST_MESSAGE_AT;
  return messages.map((message) => {
    if (message.from === "you") {
      const arriveAt = clock;
      clock += PAUSE_BEFORE_TYPING;
      return { ...message, arriveAt };
    }
    const typingFrom = clock;
    const arriveAt = typingFrom + TYPING_FOR;
    clock = arriveAt + PAUSE_BEFORE_NEXT_QUESTION;
    return { ...message, typingFrom, arriveAt };
  });
};

const SCHEDULE = scheduleConversation(CONVERSATION);

const arrive = keyframes`
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to { opacity: 1; transform: none; }
`;

const typeThenStop = keyframes`
  0% { opacity: 0; }
  12% { opacity: 1; }
  88% { opacity: 1; }
  100% { opacity: 0; }
`;

export const bubbleShape = (mine) => ({
  px: 1.75,
  py: 1.1,
  maxWidth: "84%",
  borderRadius: mine ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
  background: (theme) => (mine ? gradientOf(theme.palette.primary.bubble) : theme.palette.chat.bubbleIn),
  color: mine ? "common.white" : "text.primary",
  boxShadow: (theme) => (mine ? "none" : `0 1px 2px ${theme.palette.chat.shade}`),
  fontSize: 15,
  lineHeight: 1.45,
});

const MessageText = ({ parts }) =>
  parts.map((part, position) =>
    typeof part === "string" ? (
      part
    ) : (
      <Box component="strong" key={position} sx={{ fontWeight: 800 }}>
        {part.strong}
      </Box>
    )
  );

export const TypingIndicator = () => (
  <Box sx={{ display: "flex", color: "text.secondary" }}>
    <TypingDots size={7} />
  </Box>
);

const TypingBubble = ({ from, until }) => (
  <Box
    aria-hidden="true"
    sx={{
      ...bubbleShape(false),
      gridArea: "1 / 1",
      alignSelf: "end",
      py: 1.5,
      animation: `${typeThenStop} ${until - from}ms linear ${from}ms both`,
      [NO_MOTION]: { display: "none" },
    }}
  >
    <TypingIndicator />
  </Box>
);

const Message = ({ from, parts, typingFrom, arriveAt }) => {
  const mine = from === "you";
  return (
    <Box
      component="li"
      sx={{ display: "grid", justifyItems: mine ? "end" : "start" }}
    >
      {!mine && <TypingBubble from={typingFrom} until={arriveAt} />}
      <Box
        sx={{
          ...bubbleShape(mine),
          gridArea: "1 / 1",
          animation: `${arrive} 320ms ease-out ${arriveAt}ms both`,
          [NO_MOTION]: { animation: "none" },
        }}
      >
        <MessageText parts={parts} />
      </Box>
    </Box>
  );
};

const Composer = () => (
  <Stack
    aria-hidden="true"
    direction="row"
    spacing={1.25}
    alignItems="center"
    sx={{ p: 2, borderTop: 1, borderColor: "divider" }}
  >
    <Box
      sx={{
        flexGrow: 1,
        px: 2,
        py: 1.25,
        borderRadius: 99,
        bgcolor: "background.default",
        color: "text.disabled",
        fontSize: 15,
      }}
    >
      Message
    </Box>
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        width: 42,
        height: 42,
        borderRadius: "50%",
        bgcolor: "primary.main",
        color: "primary.contrastText",
      }}
    >
      <PaperPlaneRight size={20} weight="fill" />
    </Stack>
  </Stack>
);

export const ChatWindow = ({ label, children, sx }) => (
  <Box
    sx={{
      width: "100%",
      bgcolor: "chat.canvas",
      border: 1,
      borderColor: "divider",
      borderRadius: "28px",
      boxShadow: (theme) => theme.customShadows?.z24,
      overflow: "hidden",
      ...sx,
    }}
  >
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: "divider" }}
    >
      <Badge
        overlap="circular"
        variant="dot"
        color="success"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{
          "& .MuiBadge-badge": {
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: 2,
            borderColor: "chat.canvas",
          },
        }}
      >
        <Avatar src={whisprlFace} alt="" sx={{ width: 44, height: 44 }} />
      </Badge>
      <Box>
        <Typography variant="subtitle1" component="p" sx={{ fontWeight: 700 }}>
          Whisprl
        </Typography>
        <Typography variant="caption" component="p" color="text.secondary">
          Online
        </Typography>
      </Box>
    </Stack>

    <Stack component="ol" aria-label={label} spacing={1.25} sx={{ listStyle: "none", m: 0, px: 2.5, py: 3 }}>
      {children}
    </Stack>

    <Composer />
  </Box>
);

const HeroConversation = () => (
  <ChatWindow
    label="An example conversation on Whisprl"
    sx={{ maxWidth: 440, mx: { xs: "auto", md: 0 }, ml: { md: "auto" } }}
  >
    {SCHEDULE.map((message, position) => (
      <Message key={position} {...message} />
    ))}
  </ChatWindow>
);

export default HeroConversation;
