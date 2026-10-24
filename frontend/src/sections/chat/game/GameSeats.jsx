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
const Versus = ({ theme }) => (
  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", alignSelf: "flex-start", mt: 2.4 }}>
    <Flourish colour={theme.accent} isLeading />
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
    <Flourish colour={theme.accent} />
  </Stack>
);

const GameSeats = ({ conversation, session, game, meId, isManager, act, onTake, onLeave, onSaveSeat }) => {
  const isVersus = Boolean(game.versus) && session.seats.length === 2;
  const managerOf = (index) =>
    isManager && {
      onLift: () => act({ type: "lift", index }),
      onLock: (locked) => act({ type: "lock", index, locked }),
      onInvite: () => onSaveSeat(index),
    };

  return (
    <Stack direction="row" sx={{ justifyContent: "center", flexWrap: isVersus ? "nowrap" : "wrap", columnGap: isVersus ? 1 : 3, rowGap: 1.5, flexShrink: 0 }}>
      {session.seats.map((seat, index) => (
        <Fragment key={index}>
          {isVersus && index === 1 && <Versus theme={game.theme} />}
          <Seat
            seat={seat}
            conversation={conversation}
            meId={meId}
            theme={game.theme}
            size={isVersus ? 60 : 50}
            mark={game.Mark ? <game.Mark seat={index} state={session.state} /> : null}
            onTake={onTake && mayTake(seat, meId) ? () => onTake(index) : null}
            onLeave={onLeave}
            manage={managerOf(index)}
          />
        </Fragment>
      ))}
    </Stack>
  );
};

export default GameSeats;
