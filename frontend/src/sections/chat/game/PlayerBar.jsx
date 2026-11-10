import { Fragment } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha, getContrastRatio } from "@mui/material/styles";

import BotFace from "@/sections/chat/game/BotFace";
import { botNameOf } from "@/sections/chat/game/bots";
import { AvatarReaction, SeatSaying } from "@/sections/chat/game/RoomChatter";
import TurnRing from "@/sections/chat/game/TurnRing";
import { sayerAt } from "@/sections/chat/game/useRoomChatter";
import useSecondsLeft from "@/sections/chat/game/useSecondsLeft";
import getAvatar from "@/utils/avatars";
import { firstNameIn, memberOf } from "@/utils/groups";

const HURRY_AT = 5;
const HURRY = "#E5484D";
const MARK = 22;
const VS = 84;
// dark and see-through, so white names read over any game's art
const TAG_SHADE = "rgba(18, 12, 28, 0.72)";

const faceSizeFor = (players) => {
  if (players <= 3) return 56;
  return players === 4 ? 50 : 44;
};

const inkOn = (colour) => (getContrastRatio(colour, "#fff") >= 3 ? "#fff" : "#1d1530");

const nameOf = (seat, conversation, meId) => {
  if (seat.bot) return botNameOf(seat);
  if (seat.user === meId) return "You";
  return seat.user ? firstNameIn(conversation, seat.user, meId) : "Empty";
};

const faceOf = (seat, conversation, size) => {
  if (seat.bot || seat.away) return <BotFace seat={seat} size={size} iconScale={0.55} />;
  const member = seat.user && memberOf(conversation, seat.user);
  return member ? getAvatar(member.avatar, member.firstName, size) : null;
};

// the seconds sit over the face, which darkens beneath them, so the clock is where the eye already is
const SecondsOnFace = ({ seconds, face, isHurrying }) => (
  <Typography
    aria-label={`${seconds} seconds left`}
    sx={{
      position: "absolute",
      inset: 0,
      zIndex: 1,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      bgcolor: isHurrying ? alpha(HURRY, 0.78) : "rgba(12, 8, 20, 0.68)",
      color: "#fff",
      fontSize: Math.round(face * 0.4),
      fontWeight: 900,
      lineHeight: 1,
      fontVariantNumeric: "tabular-nums",
      textShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
      pointerEvents: "none",
      transition: "background-color 220ms ease",
    }}
  >
    {seconds}
  </Typography>
);

const PlayerToken = ({ seat, index, face, conversation, game, state, meId, isTurn, turnEndsAt, turnSeconds, onLeave }) => {
  const { theme } = game;
  const isMine = seat.user === meId && !seat.bot;
  // a game deals its own colours, so the canvas asks rather than assuming a seat's place in a list
  const colour = game.colourOf?.(state, index) ?? theme.marks[index];
  const clock = isTurn ? turnEndsAt : null;
  const secondsLeft = useSecondsLeft(clock);
  // a bot's turn is a short pause rather than the full clock, so its ring starts full and drains over that pause
  const isBotPlaying = Boolean(seat.bot || seat.away || seat.official);
  const clockColour = !isBotPlaying && secondsLeft !== null && secondsLeft <= HURRY_AT ? HURRY : colour;
  const isOut = Boolean(game.isOut?.(state, index));
  const tagColour = isTurn ? clockColour : TAG_SHADE;

  return (
    // what the player says hangs off the token rather than inside it, so the bar never resizes for their words
    <Box sx={{ position: "relative", flex: "1 1 0", minWidth: 0, maxWidth: face + 56, display: "flex", justifyContent: "center" }}>
      <ButtonBase
        disabled={!isMine || !onLeave}
        onClick={onLeave}
        aria-label={isMine && onLeave ? "Leave the game" : undefined}
        sx={{ minWidth: 0, maxWidth: "100%", flexDirection: "column", alignItems: "center", borderRadius: 3 }}
      >
        <Box sx={{ position: "relative" }}>
          <Box
            sx={{
              width: face,
              height: face,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              color: theme.ink,
              bgcolor: theme.card,
              boxShadow: clock ? `0 0 18px 3px ${alpha(colour, 0.55)}` : `0 0 0 3px ${colour}, 0 4px 12px rgba(0, 0, 0, 0.22)`,
              transition: "box-shadow 220ms ease",
            }}
          >
            {faceOf(seat, conversation, face)}
          </Box>
          {clock && <TurnRing key={clock} endsAt={clock} seconds={isBotPlaying ? null : turnSeconds} colour={clockColour} />}
          {secondsLeft !== null && !isBotPlaying && <SecondsOnFace seconds={secondsLeft} face={face} isHurrying={clockColour === HURRY} />}
          {game.Mark && (
            <Box
              sx={{
                position: "absolute",
                top: -4,
                right: -6,
                zIndex: 2,
                width: MARK,
                height: MARK,
                p: "3px",
                borderRadius: "50%",
                bgcolor: theme.card,
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
              }}
            >
              <game.Mark seat={index} state={state} />
            </Box>
          )}
          <AvatarReaction user={sayerAt(seat, index)} size={face} />
        </Box>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            // above a reaction spilling out past the face, so the name stays readable
            position: "relative",
            zIndex: 4,
            mt: 0.6,
            maxWidth: "100%",
            alignItems: "baseline",
            px: 1.1,
            py: 0.3,
            borderRadius: 99,
            bgcolor: tagColour,
            color: inkOn(tagColour),
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
            transition: "background-color 220ms ease, color 220ms ease",
          }}
        >
          <Typography noWrap sx={{ minWidth: 0, fontSize: 12.5, fontWeight: 800, lineHeight: 1.3 }}>
            {nameOf(seat, conversation, meId)}
          </Typography>
          {isOut && <Typography sx={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, opacity: 0.7 }}>Out</Typography>}
        </Stack>
      </ButtonBase>
      <SeatSaying user={sayerAt(seat, index)} theme={theme} />
    </Box>
  );
};

const VersusMark = ({ src, face }) => (
  <Box sx={{ flexShrink: 0, width: VS, height: face, display: "grid", placeItems: "center" }}>
    <Box component="img" src={src} alt="" draggable={false} sx={{ width: VS, height: VS, display: "block" }} />
  </Box>
);

// who is playing and whose turn it is, as a row of faces at their own size, so no card stretches into empty space
const PlayerBar = ({ conversation, session, game, meId, onLeave }) => {
  const isVersus = session.seats.length === 2;
  const face = faceSizeFor(session.seats.length);

  return (
    <Stack direction="row" spacing={isVersus ? 0 : 0.5} sx={{ alignItems: "flex-start", justifyContent: "center", px: 2, pt: 1.5, flexShrink: 0 }}>
      {session.seats.map((seat, index) => (
        <Fragment key={index}>
          {index > 0 && isVersus && game.versusArt && <VersusMark src={game.versusArt} face={face} />}
          <PlayerToken
            seat={seat}
            index={index}
            face={face}
            conversation={conversation}
            game={game}
            state={session.state}
            meId={meId}
            isTurn={session.status === "playing" && session.turn === index}
            turnEndsAt={session.turnEndsAt}
            turnSeconds={session.turnSeconds}
            onLeave={session.status === "playing" ? onLeave : null}
          />
        </Fragment>
      ))}
    </Stack>
  );
};

export default PlayerBar;
