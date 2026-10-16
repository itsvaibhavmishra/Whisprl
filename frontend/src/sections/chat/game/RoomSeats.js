import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useDispatch } from "react-redux";

import { ActInGame } from "@/redux/slices/actions/gameActions";
import { mayTake } from "@/sections/chat/game/GameSeats";
import Seat from "@/sections/chat/game/Seat";
import useSecondsLeft from "@/sections/chat/game/useSecondsLeft";

const OWNER_SEAT = 0;

const RoomSeats = ({ conversation, session, theme, meId, isManager, onInvite }) => {
  const dispatch = useDispatch();
  const coolingFor = useSecondsLeft(session.cooldownUntil);
  const { roomSeats, here } = session;
  const hasRoomSeat = roomSeats.some((seat) => seat.user === meId);
  const standing = here.filter((userId) => !roomSeats.some((seat) => seat.user === userId)).length;
  const act = (action) => dispatch(ActInGame({ conversationId: conversation._id, kind: "room", ...action }));

  const takerOf = (seat, index) => !hasRoomSeat && !coolingFor && mayTake(seat, meId) && (() => act({ type: "sit", index }));
  const managerOf = (index) =>
    isManager && {
      onLift: () => act({ type: "lift", index }),
      onLock: (locked) => act({ type: "lock", index, locked }),
      onInvite: () => onInvite({ kind: "room", index }),
    };

  return (
    <Stack direction="row" alignItems="flex-start" spacing={0.5} sx={{ px: 2, pt: 1, pb: 1.5, overflowX: "auto", flexShrink: 0 }}>
      {roomSeats.map((seat, index) =>
        index === OWNER_SEAT ? (
          <Seat key={index} seat={seat} conversation={conversation} meId={meId} theme={theme} size={40} isDim={!seat.present} note={seat.present ? null : "Left"} />
        ) : (
          <Seat
            key={index}
            seat={seat}
            conversation={conversation}
            meId={meId}
            theme={theme}
            size={40}
            onTake={takerOf(seat, index)}
            onLeave={() => act({ type: "stand" })}
            manage={managerOf(index)}
          />
        )
      )}
      {standing > 0 && (
        <Box sx={{ alignSelf: "center", pl: 1, pb: 2.5, flexShrink: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: alpha(theme.ink, 0.75), whiteSpace: "nowrap" }}>+{standing} here</Typography>
        </Box>
      )}
    </Stack>
  );
};

export default RoomSeats;
