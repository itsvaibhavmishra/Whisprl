import { useState } from "react";
import { Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDispatch } from "react-redux";

import ConfirmDialog from "@/components/ConfirmDialog";
import { ActInGame, TakeSeat } from "@/redux/slices/actions/gameActions";
import Seat from "@/sections/chat/game/Seat";
import useSecondsLeft from "@/sections/chat/game/useSecondsLeft";

export const mayTake = (seat, meId) => !seat.user && (!seat.locked || seat.invited === meId);

const GameSeats = ({ conversation, session, game, meId, isManager, onInvite }) => {
  const dispatch = useDispatch();
  const [isLeaving, setIsLeaving] = useState(false);
  const coolingFor = useSecondsLeft(session.cooldownUntil);
  const turnSecondsLeft = useSecondsLeft(session.turnEndsAt);
  const conversationId = conversation._id;
  const isPlaying = session.status === "playing";
  const mySeat = session.seats.find((seat) => seat.user === meId);
  const act = (action) => dispatch(ActInGame({ conversationId, kind: "game", ...action }));

  const filled = { bgcolor: game.theme.marks[0], color: game.theme.surface, "&:hover": { bgcolor: alpha(game.theme.marks[0], 0.85) } };
  const readyLabel = () => {
    if (mySeat.ready) return "Not ready";
    return session.result ? "Play again" : "Ready";
  };

  const getUp = () => (isPlaying ? setIsLeaving(true) : act({ type: "stand" }));
  const takerOf = (seat, index) =>
    !mySeat && !isPlaying && !coolingFor && mayTake(seat, meId) && (() => dispatch(TakeSeat({ conversationId, kind: "game", index })));
  const managerOf = (index) =>
    isManager &&
    !isPlaying && {
      onLift: () => act({ type: "lift", index }),
      onLock: (locked) => act({ type: "lock", index, locked }),
      onInvite: () => onInvite({ kind: "game", index }),
    };

  return (
    <Stack alignItems="center" spacing={1.5} sx={{ px: 2, pb: 2.5 }}>
      <Stack direction="row" justifyContent="center" spacing={3}>
        {session.seats.map((seat, index) => {
          const isTurn = isPlaying && session.turn === index;
          const isPersonToMove = isTurn && !seat.bot && !seat.away;
          return (
            <Seat
              key={index}
              seat={seat}
              conversation={conversation}
              meId={meId}
              theme={game.theme}
              size={64}
              mark={{ label: game.seatMarks[index], color: game.theme.marks[index] }}
              isTurn={isTurn}
              note={isPersonToMove && turnSecondsLeft ? `${turnSecondsLeft}s` : null}
              onTake={takerOf(seat, index)}
              onLeave={getUp}
              manage={managerOf(index)}
            />
          );
        })}
      </Stack>
      {mySeat && !isPlaying && (
        <Button
          variant={mySeat.ready ? "outlined" : "contained"}
          onClick={() => act({ type: "ready", ready: !mySeat.ready })}
          sx={{ minWidth: 140, borderRadius: 99, ...(mySeat.ready ? { color: game.theme.ink, borderColor: alpha(game.theme.ink, 0.5) } : filled) }}
        >
          {readyLabel()}
        </Button>
      )}
      {mySeat?.away && isPlaying && (
        <Button variant="contained" onClick={() => act({ type: "back" })} sx={{ minWidth: 140, borderRadius: 99, ...filled }}>
          Take my seat back
        </Button>
      )}
      {coolingFor && <Typography sx={{ fontSize: 13, color: alpha(game.theme.ink, 0.7) }}>You can sit again in {coolingFor}s</Typography>}
      {isLeaving && (
        <ConfirmDialog
          title="Leave the game?"
          text="A bot plays your seat for the rest of this game."
          action="Leave"
          onConfirm={() => act({ type: "stand" })}
          onClose={() => setIsLeaving(false)}
        />
      )}
    </Stack>
  );
};

export default GameSeats;
