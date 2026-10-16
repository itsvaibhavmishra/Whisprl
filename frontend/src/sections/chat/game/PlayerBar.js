import { Fragment } from "react";
import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Robot } from "phosphor-react";

import getAvatar from "@/utils/avatars";
import { firstNameIn, memberOf } from "@/utils/groups";

const FACE = 34;

const nameOf = (seat, conversation, meId) => {
  if (seat.bot) return "Bot";
  if (seat.user === meId) return "You";
  return seat.user ? firstNameIn(conversation, seat.user, meId) : "Empty";
};

const faceOf = (seat, conversation) => {
  if (seat.bot || seat.away) return <Robot size={FACE * 0.55} weight="duotone" />;
  const member = seat.user && memberOf(conversation, seat.user);
  return member ? getAvatar(member.avatar, member.firstName, FACE) : null;
};

const PlayerCard = ({ seat, index, conversation, game, meId, isTurn, onLeave }) => {
  const { theme } = game;
  const isMine = seat.user === meId && !seat.bot;

  return (
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
        boxShadow: isTurn ? `0 0 0 2px ${theme.marks[index]}, 0 4px 14px rgba(70,48,110,0.2)` : "0 4px 14px rgba(70,48,110,0.14)",
        transition: "box-shadow 220ms ease",
      }}
    >
      <Box sx={{ width: FACE, height: FACE, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", overflow: "hidden", color: theme.ink, bgcolor: alpha(theme.ink, 0.1) }}>
        {faceOf(seat, conversation)}
      </Box>
      <Stack sx={{ minWidth: 0, alignItems: "flex-start" }}>
        <Typography noWrap sx={{ maxWidth: "100%", fontSize: 13, fontWeight: 800, color: theme.ink }}>
          {nameOf(seat, conversation, meId)}
        </Typography>
        <Box sx={{ width: 21, height: 21 }}>
          <game.Mark seat={index} />
        </Box>
      </Stack>
    </ButtonBase>
  );
};

// who is playing, and whose turn it is; two players face each other, more simply sit in a row
const PlayerBar = ({ conversation, session, game, meId, onLeave }) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, pt: 1, flexShrink: 0 }}>
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
          meId={meId}
          isTurn={session.status === "playing" && session.turn === index}
          onLeave={session.status === "playing" ? onLeave : null}
        />
      </Fragment>
    ))}
  </Stack>
);

export default PlayerBar;
