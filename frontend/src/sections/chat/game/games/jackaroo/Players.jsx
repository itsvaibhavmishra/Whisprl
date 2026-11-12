import { memo } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useSelector } from "react-redux";

import BotFace from "@/sections/chat/game/BotFace";
import { botNameOf } from "@/sections/chat/game/bots";
import { AvatarReaction, SeatSaying } from "@/sections/chat/game/RoomChatter";
import { isHere, READY_GREEN } from "@/sections/chat/game/Seat";
import TurnRing from "@/sections/chat/game/TurnRing";
import FONTS from "@/sections/chat/game/games/jackaroo/fonts";
import { Fan } from "@/sections/chat/game/games/jackaroo/Table";
import useSecondsLeft from "@/sections/chat/game/useSecondsLeft";
import getAvatar from "@/utils/avatars";
import { firstNameIn, memberOf } from "@/utils/groups";

const FACE = 48;
const INK = "#f6ebdd";

const nameOf = (seat, conversation, meId) => {
  if (seat.bot) return botNameOf(seat);
  return seat.user ? firstNameIn(conversation, seat.user, meId) : "Empty";
};

// a turn's clock as the reference shows it: the face darkened, the seconds left in large gold digits, and a ring draining round it
const TurnClock = ({ startsAt, ms, seconds, colour }) => {
  const endsAt = startsAt + ms;
  const left = useSecondsLeft(endsAt) ?? 0;
  return (
    <>
      <TurnRing endsAt={endsAt} seconds={seconds} colour={colour} gap={4} />
      <Box sx={{ position: "absolute", inset: 0, borderRadius: "50%", bgcolor: "rgba(10, 6, 4, 0.5)", pointerEvents: "none" }} />
      <Typography
        aria-label={`${left} seconds left`}
        sx={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          fontFamily: FONTS.display,
          fontWeight: 700,
          fontSize: 21,
          lineHeight: 1,
          background: "linear-gradient(180deg, #fff3b0 0%, #ffd34d 50%, #f0a21c 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextStroke: "1px #4a2306",
          pointerEvents: "none",
        }}
      >
        {left}
      </Typography>
    </>
  );
};

// partners share a letter, so who plays with whom reads at a glance and never by colour alone
const TeamBadge = ({ team }) => (
  <Typography
    aria-label={`Team ${team}`}
    sx={{
      position: "absolute",
      left: -3,
      bottom: -3,
      width: 19,
      height: 19,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      // never in a marble's colour, which belongs to the player and not the team
      bgcolor: "#2a1a10",
      color: "#ffd34d",
      border: "1px solid #e8c48a",
      fontFamily: FONTS.display,
      fontWeight: 700,
      fontSize: 11,
      lineHeight: 1,
      boxShadow: "0 0 0 2px #1a100b",
    }}
  >
    {team}
  </Typography>
);

// the player's face in a ring of their marbles' colour, grown a little with the clock over it while it is their turn
const Face = ({ seat, sayer, member, colour, clock, tag, team, isHere: here, onLeave }) => (
  <ButtonBase
    disabled={!onLeave}
    onClick={onLeave || undefined}
    aria-label={onLeave ? "Leave the game" : undefined}
    sx={{
      position: "relative",
      flexShrink: 0,
      width: FACE,
      height: FACE,
      borderRadius: "50%",
      transform: clock ? "scale(1.18)" : "none",
      transition: "transform 250ms ease",
    }}
  >
    <Box
      sx={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        bgcolor: "rgba(26, 16, 11, 0.9)",
        boxShadow: clock ? "none" : `0 0 0 3px ${colour}, 0 0 14px ${alpha(colour, 0.55)}`,
      }}
    >
      {seat.bot || seat.away ? <BotFace seat={seat} size={FACE} /> : member && getAvatar(member.avatar, member.firstName, FACE)}
    </Box>
    {clock && <TurnClock key={clock.startsAt} startsAt={clock.startsAt} ms={clock.ms} seconds={clock.seconds} colour={colour} />}
    <AvatarReaction user={sayer} size={FACE} />
    {tag && (
      <Typography
        sx={{
          position: "absolute",
          left: "50%",
          top: -9,
          transform: "translateX(-50%)",
          px: 0.75,
          borderRadius: 1,
          bgcolor: "#d3192d",
          color: "#fff",
          fontFamily: FONTS.body,
          fontWeight: 800,
          fontSize: 10,
          lineHeight: "15px",
          letterSpacing: "0.04em",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.45)",
        }}
      >
        {tag}
      </Typography>
    )}
    {team && <TeamBadge team={team} />}
    {here && (
      <Box
        sx={{ position: "absolute", right: -1, bottom: -1, width: 13, height: 13, borderRadius: "50%", bgcolor: READY_GREEN, boxShadow: "0 0 0 2.5px #1a100b" }}
      />
    )}
  </ButtonBase>
);

// a dot for each marble, filled in its colour once it is home
const HomeCount = ({ home, colour }) => (
  <Stack spacing={0.4}>
    <Stack direction="row" spacing={0.6}>
      {[0, 1, 2, 3].map((slot) => (
        <Box
          key={slot}
          sx={{
            width: 11,
            height: 11,
            borderRadius: "50%",
            border: `1.5px solid ${slot < home ? colour : alpha(INK, 0.45)}`,
            bgcolor: slot < home ? colour : "transparent",
          }}
        />
      ))}
    </Stack>
    <Typography sx={{ fontSize: 11, fontWeight: 600, color: alpha(INK, 0.75), lineHeight: 1 }}>{`${home}/4 home`}</Typography>
  </Stack>
);

const Name = ({ children, sx }) => (
  <Typography
    noWrap
    sx={{
      maxWidth: "100%",
      fontFamily: FONTS.body,
      fontSize: 15,
      fontWeight: 600,
      color: INK,
      lineHeight: 1.1,
      textShadow: "0 1px 3px rgba(0, 0, 0, 0.6)",
      ...sx,
    }}
  >
    {children}
  </Typography>
);

// one player in a corner of the board, face outermost, beside their hidden cards or marbles home; below the board the name sits under the face
const Player = ({
  seat,
  sayer,
  conversation,
  meId,
  colour,
  clock,
  tag,
  team = null,
  home,
  cardsHeld,
  isHandAway,
  arrival,
  shoeRef,
  isStill,
  isOnRight = false,
  isBelow = false,
  isCompact = false,
  onLeave,
  ref: fanRef,
}) => {
  const onlineFriends = useSelector((store) => store.user.onlineFriends);
  const member = seat.user && !seat.bot ? memberOf(conversation, seat.user) : null;
  return (
    <Stack direction={isOnRight ? "row-reverse" : "row"} spacing={1.25} sx={{ alignItems: isCompact ? "flex-start" : "center", px: 1.5, py: 0.75 }}>
      <Box sx={{ position: "relative", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Face
          seat={seat}
          sayer={sayer}
          member={member}
          colour={colour}
          clock={clock}
          tag={tag}
          team={team}
          isHere={isHere(seat, member, meId, onlineFriends)}
          onLeave={onLeave}
        />
        {isBelow && (
          <Name sx={{ position: "absolute", top: "calc(100% + 6px)", maxWidth: FACE + 40, textAlign: "center" }}>{nameOf(seat, conversation, meId)}</Name>
        )}
        <SeatSaying user={sayer} theme={{ card: "rgba(250, 241, 228, 0.96)", ink: "#2b1b12" }} placement={isOnRight ? "belowEnd" : "belowStart"} />
      </Box>
      <Stack spacing={0.6} sx={{ alignItems: isOnRight ? "flex-end" : "flex-start", minWidth: 0 }}>
        {!isBelow && <Name>{nameOf(seat, conversation, meId)}</Name>}
        {cardsHeld === undefined ? (
          <HomeCount home={home} colour={colour} />
        ) : (
          <Fan ref={fanRef} count={cardsHeld} arrival={arrival} shoeRef={shoeRef} isStill={isStill} isAway={isHandAway} size={isCompact ? 17 : undefined} />
        )}
      </Stack>
    </Stack>
  );
};

export default memo(Player);
