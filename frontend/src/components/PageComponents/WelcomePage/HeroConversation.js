import { Avatar, Badge, Box, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { PaperPlaneRight } from "phosphor-react";

import whisprlFace from "@/assets/icons/logo/WhisprlAvatar.webp";
import { CONVERSATION } from "@/components/PageComponents/WelcomePage/content";
import { NO_MOTION } from "@/components/PageComponents/WelcomePage/styles";

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

const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-3px); opacity: 1; }
`;

export const bubbleShape = (mine) => ({
  px: 1.75,
  py: 1.1,
  maxWidth: "84%",
  borderRadius: mine ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
  bgcolor: mine ? "primary.main" : "background.default",
  color: mine ? "primary.contrastText" : "text.primary",
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

export const TypingDots = () => (
  <Box sx={{ display: "flex", gap: 0.5 }}>
    {[0, 1, 2].map((dot) => (
      <Box
        key={dot}
        sx={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          bgcolor: "text.secondary",
          animation: `${bounce} 1s ease-in-out ${dot * 150}ms infinite`,
          [NO_MOTION]: { animation: "none" },
        }}
      />
    ))}
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
    <TypingDots />
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

const HeroConversation = () => (
  <Box
    sx={{
      width: "100%",
      maxWidth: 440,
      mx: { xs: "auto", md: 0 },
      ml: { md: "auto" },
      bgcolor: "background.paper",
      border: 1,
      borderColor: "divider",
      borderRadius: "28px",
      boxShadow: (theme) => theme.customShadows?.z24,
      overflow: "hidden",
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
            borderColor: "background.paper",
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

    <Stack
      component="ol"
      aria-label="An example conversation on Whisprl"
      spacing={1.25}
      sx={{ listStyle: "none", m: 0, px: 2.5, py: 3 }}
    >
      {SCHEDULE.map((message, position) => (
        <Message key={position} {...message} />
      ))}
    </Stack>

    <Composer />
  </Box>
);

export default HeroConversation;
