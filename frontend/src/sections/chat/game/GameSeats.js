import { Stack } from "@mui/material";

import Seat from "@/sections/chat/game/Seat";
import { mayTake } from "@/sections/chat/game/seats";

const GameSeats = ({ conversation, session, game, meId, isManager, act, onTake, onLeave, onSaveSeat }) => {
  const managerOf = (index) =>
    isManager && {
      onLift: () => act({ type: "lift", index }),
      onLock: (locked) => act({ type: "lock", index, locked }),
      onInvite: () => onSaveSeat(index),
    };

  return (
    <Stack direction="row" justifyContent="center" flexWrap="wrap" useFlexGap columnGap={3} rowGap={1.5} sx={{ flexShrink: 0 }}>
      {session.seats.map((seat, index) => (
        <Seat
          key={index}
          seat={seat}
          conversation={conversation}
          meId={meId}
          theme={game.theme}
          size={50}
          mark={game.Mark ? <game.Mark seat={index} state={session.state} /> : null}
          onTake={onTake && mayTake(seat, meId) ? () => onTake(index) : null}
          onLeave={onLeave}
          manage={managerOf(index)}
        />
      ))}
    </Stack>
  );
};

export default GameSeats;
