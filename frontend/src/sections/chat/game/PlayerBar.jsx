import { Fragment } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import BotFace, { BOT_NAME } from "@/sections/chat/game/BotFace";
import { AvatarReaction, SeatSaying } from "@/sections/chat/game/RoomChatter";
import TurnRing from "@/sections/chat/game/TurnRing";
import useSecondsLeft from "@/sections/chat/game/useSecondsLeft";
import getAvatar from "@/utils/avatars";
import { firstNameIn, memberOf } from "@/utils/groups";

const FACE = 34;
const HURRY_AT = 5;
const HURRY = "#E5484D";

const nameOf = (seat, conversation, meId) => {
  if (seat.bot) return BOT_NAME;
  if (seat.user === meId) return "You";
  return seat.user ? firstNameIn(conversation, seat.user, meId) : "Empty";
};

const faceOf = (seat, conversation) => {
  if (seat.bot || seat.away) return <BotFace size={FACE * 0.55} />;
  const member = seat.user && memberOf(conversation, seat.user);
  return member ? getAvatar(member.avatar, member.firstName, FACE) : null;
};

const PlayerCard = ({ seat, index, conversation, game, state, meId, isTurn, turnEndsAt, turnSeconds, onLeave }) => {
  const { theme } = game;
  const isMine = seat.user === meId && !seat.bot;
  // a game deals its own colours, so the canvas asks rather than assuming a seat's place in a list
  const colour = game.colourOf?.(state, index) ?? theme.marks[index];
  const clock = isTurn ? turnEndsAt : null;
  const secondsLeft = useSecondsLeft(clock);
  // a bot's turn is a short pause rather than the full clock, so its ring starts full and drains over that pause
  const isBotPlaying = Boolean(seat.bot || seat.away);
  const clockColour = !isBotPlaying && secondsLeft !== null && secondsLeft <= HURRY_AT ? HURRY : colour;
  // a player knocked out keeps their place and loses their colour, because a card that vanished would look like they had left
  const isOut = Boolean(game.isOut?.(state, index));

  return (
    // what the player says sits beside the card rather than in it, so a card faded for being out never fades their words
    <Box sx={{ position: "relative", flex: 1, minWidth: 0, display: "flex" }}>
      <ButtonBase
        disabled={!isMine || !onLeave}
        onClick={onLeave}
        aria-label={isMine && onLeave ? "Leave the game" : undefined}
        sx={{
          flex: 1,
          minWidth: 0,
          gap: 1.25,
          px: 1.25,
          py: 1,
          borderRadius: 3.5,
          justifyContent: "center",
          bgcolor: theme.card,
          boxShadow: isTurn ? `0 0 0 2px ${colour}, 0 4px 14px rgba(70,48,110,0.2)` : "0 4px 14px rgba(70,48,110,0.14)",
          filter: isOut ? "grayscale(1)" : "none",
          opacity: isOut ? 0.5 : 1,
          transition: "box-shadow 220ms ease, filter 300ms ease, opacity 300ms ease",
        }}
      >
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          <Box
            sx={{
              width: FACE,
              height: FACE,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              color: theme.ink,
              bgcolor: alpha(theme.ink, 0.1),
              boxShadow: clock ? "none" : `0 0 0 2.5px ${colour}`,
            }}
          >
            {faceOf(seat, conversation)}
          </Box>
          {clock && <TurnRing key={clock} endsAt={clock} seconds={isBotPlaying ? null : turnSeconds} colour={clockColour} />}
          {seat.user && !seat.bot && <AvatarReaction user={seat.user} size={FACE} />}
        </Box>
        <Stack sx={{ minWidth: 0, alignItems: "flex-start" }}>
          <Typography noWrap sx={{ maxWidth: "100%", fontSize: 13, fontWeight: 800, color: theme.ink }}>
            {nameOf(seat, conversation, meId)}
          </Typography>
          {/* the same height whoever's turn it is, so the board below never shifts as turns pass */}
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minHeight: 21 }}>
            {game.Mark && (
              <Box sx={{ width: 21, height: 21 }}>
                <game.Mark seat={index} state={state} />
              </Box>
            )}
            {isOut && <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha(theme.ink, 0.7) }}>Out</Typography>}
            {secondsLeft !== null && (
              <Typography sx={{ fontSize: 12, fontWeight: 800, color: clockColour, fontVariantNumeric: "tabular-nums" }}>{`${secondsLeft}s`}</Typography>
            )}
          </Stack>
        </Stack>
      </ButtonBase>
      {seat.user && !seat.bot && <SeatSaying user={seat.user} theme={theme} />}
    </Box>
  );
};

// who is playing, and whose turn it is; two players face each other, more simply sit in a row
const PlayerBar = ({ conversation, session, game, meId, onLeave }) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: "center", px: 2, pt: 1, flexShrink: 0 }}>
    {session.seats.map((seat, index) => (
      <Fragment key={index}>
        {index > 0 && session.seats.length === 2 && (
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: alpha(game.theme.ink, 0.55), flexShrink: 0 }}>VS</Typography>
        )}
        <PlayerCard
          seat={seat}
          index={index}
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

export default PlayerBar;
