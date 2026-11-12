import { Fragment } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { lighten } from "@mui/material/styles";

import { displayFontOf } from "@/sections/chat/game/gameFonts";
import Seat from "@/sections/chat/game/Seat";
import { mayTake } from "@/sections/chat/game/seats";

const Flourish = ({ colour, isLeading }) => (
  <Stack direction={isLeading ? "row" : "row-reverse"} spacing={0.5} sx={{ alignItems: "center" }}>
    <Box sx={{ width: 5, height: 5, transform: "rotate(45deg)", bgcolor: colour }} />
    <Box sx={{ width: 14, height: 1.5, bgcolor: colour, opacity: 0.8 }} />
  </Stack>
);

// two seats facing each other read as a match, so a game can set its pair either side of a Vs
const Versus = ({ theme, isCompact }) => (
  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", alignSelf: "flex-start", mt: isCompact ? 4.2 : 2.4 }}>
    {!isCompact && <Flourish colour={theme.accent} isLeading />}
    <Typography
      sx={{
        fontFamily: displayFontOf(theme),
        fontSize: 26,
        fontWeight: 700,
        lineHeight: 1,
        background: `linear-gradient(180deg, ${lighten(theme.accent, 0.45)} 0%, ${theme.accent} 100%)`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      Vs
    </Typography>
    {!isCompact && <Flourish colour={theme.accent} />}
  </Stack>
);

// a team's seats together under its name, so taking a seat is choosing a side
const Team = ({ name, theme, children }) => (
  <Stack spacing={1} sx={{ alignItems: "center" }}>
    <Typography sx={{ fontFamily: displayFontOf(theme), fontSize: 15, fontWeight: 700, color: theme.accent, lineHeight: 1 }}>{name}</Typography>
    <Stack direction="row" spacing={0.5}>
      {children}
    </Stack>
  </Stack>
);

const GameSeats = ({ conversation, session, game, meId, isManager, act, onTake, onLeave, onSaveSeat }) => {
  const isVersus = Boolean(game.versus) && session.seats.length === 2;
  const managerOf = (index) =>
    isManager && {
      onLift: () => act({ type: "lift", index }),
      onLock: (locked) => act({ type: "lock", index, locked }),
      onInvite: () => onSaveSeat(index),
      onRemoveBot: () => act({ type: "bot", index, seated: false }),
    };
  const seatAt = (index, size) => (
    <Seat
      key={index}
      seat={session.seats[index]}
      index={index}
      conversation={conversation}
      meId={meId}
      theme={game.theme}
      size={size}
      mark={game.Mark ? <game.Mark seat={index} state={session.state} /> : null}
      onTake={onTake && mayTake(session.seats[index], meId) ? () => onTake(index) : null}
      onLeave={onLeave}
      manage={managerOf(index)}
    />
  );

  // partners sit opposite, so seats 1 and 3 make one team and seats 2 and 4 the other
  if (game.teams && session.seats.length === game.teams.length) {
    const membersOf = (team) => game.teams.flatMap((side, index) => (side === team ? [index] : []));
    return (
      // four seats and a Vs fit a narrow phone without flourishes, wider than the controls below them if they must be
      <Stack direction="row" sx={{ justifyContent: "center", alignItems: "flex-start", columnGap: 1, flexShrink: 0, width: "max-content" }}>
        <Team name="Team A" theme={game.theme}>
          {membersOf(0).map((index) => seatAt(index, 46))}
        </Team>
        <Versus theme={game.theme} isCompact />
        <Team name="Team B" theme={game.theme}>
          {membersOf(1).map((index) => seatAt(index, 46))}
        </Team>
      </Stack>
    );
  }

  return (
    <Stack direction="row" sx={{ justifyContent: "center", flexWrap: isVersus ? "nowrap" : "wrap", columnGap: isVersus ? 1 : 3, rowGap: 1.5, flexShrink: 0 }}>
      {session.seats.map((_, index) => (
        <Fragment key={index}>
          {isVersus && index === 1 && <Versus theme={game.theme} />}
          {seatAt(index, isVersus ? 60 : 50)}
        </Fragment>
      ))}
    </Stack>
  );
};

export default GameSeats;
