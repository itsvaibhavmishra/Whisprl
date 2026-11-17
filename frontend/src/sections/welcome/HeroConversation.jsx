import { Avatar, Badge, Box, Stack, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { GameControllerIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";

import whisprlFace from "@/assets/icons/logo/WhisprlAvatar.webp";
import TypingDots from "@/components/TypingDots";
import GameTitle from "@/sections/chat/game/GameTitle";
import { GAMES } from "@/sections/chat/game/catalog";
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

const GameStarted = ({ game }) => (
  <Box
    sx={{
      position: "relative",
      width: 260,
      aspectRatio: "16 / 10",
      borderRadius: "18px 18px 18px 6px",
      overflow: "hidden",
      bgcolor: game.theme.surface,
      backgroundImage: `url(${game.art.scene})`,
      backgroundSize: "cover",
      backgroundPosition: "center 14%",
      color: "#fff",
    }}
  >
    <Box sx={{ position: "absolute", top: "10%", left: "6%", width: "56%" }}>
      <GameTitle title={game.title} name={game.name} width="100%" isStatic />
    </Box>
    <Stack
      direction="row"
      sx={{
        position: "absolute",
        inset: "auto 0 0",
        alignItems: "center",
        justifyContent: "space-between",
        px: 1.5,
        pb: 1.25,
        pt: 4,
        background: "linear-gradient(180deg, transparent, rgba(10, 8, 26, 0.85))",
      }}
    >
      <Typography sx={{ fontSize: 13.5, fontWeight: 700, textShadow: "0 1px 4px rgba(0, 0, 0, 0.55)" }}>Your table is ready</Typography>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ alignItems: "center", px: 1.5, py: 0.6, borderRadius: 99, bgcolor: game.theme.accent, color: "#fff", fontSize: 13, fontWeight: 800 }}
      >
        <GameControllerIcon size={15} weight="fill" />
        <span>Play</span>
      </Stack>
    </Stack>
  </Box>
);

const Message = ({ from, parts, game, typingFrom, arriveAt }) => {
  const mine = from === "you";
  const landing = { gridArea: "1 / 1", animation: `${arrive} 320ms ease-out ${arriveAt}ms both`, [NO_MOTION]: { animation: "none" } };
  return (
    <Box component="li" sx={{ display: "grid", justifyItems: mine ? "end" : "start" }}>
      {!mine && <TypingBubble from={typingFrom} until={arriveAt} />}
      {game ? (
        <Box sx={landing}>
          <GameStarted game={GAMES[game]} />
        </Box>
      ) : (
        <Box sx={{ ...bubbleShape(mine), ...landing }}>
          <MessageText parts={parts} />
        </Box>
      )}
    </Box>
  );
};

const Composer = () => (
  <Stack aria-hidden="true" direction="row" spacing={1.25} sx={{ alignItems: "center", p: 2, borderTop: 1, borderColor: "divider" }}>
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
      sx={{
        alignItems: "center",
        justifyContent: "center",
        width: 42,
        height: 42,
        borderRadius: "50%",
        bgcolor: "primary.main",
        color: "primary.contrastText",
      }}
    >
      <PaperPlaneRightIcon size={20} weight="fill" />
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
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", px: 2.5, py: 2, borderBottom: 1, borderColor: "divider" }}>
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
        <Typography variant="caption" component="p" sx={{ color: "text.secondary" }}>
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
  <ChatWindow label="An example conversation on Whisprl" sx={{ maxWidth: 440, mx: { xs: "auto", md: 0 }, ml: { md: "auto" } }}>
    {SCHEDULE.map((message, position) => (
      <Message key={position} {...message} />
    ))}
  </ChatWindow>
);

export default HeroConversation;
