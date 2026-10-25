import { ButtonBase, Typography } from "@mui/material";
import { m } from "motion/react";
import { GameControllerIcon } from "@phosphor-icons/react";
import { useDispatch } from "react-redux";

import { gameCollapsed } from "@/redux/slices/gameSlice";
import { GAMES } from "@/sections/chat/game/catalog";

const labelOf = (session, meId, name) => {
  if (session.status !== "playing") return `${name} is open`;
  return session.seats[session.turn]?.user === meId ? `Your turn in ${name}` : `Back to ${name}`;
};

// a hidden game keeps going, so the way back to it stays in sight
const GamePill = ({ session, meId }) => {
  const dispatch = useDispatch();
  const { name, theme } = GAMES[session.game];

  return (
    <ButtonBase
      component={m.button}
      nativeButton
      initial={{ opacity: 0, y: -12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.9 }}
      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
      onClick={() => dispatch(gameCollapsed(false))}
      sx={{
        position: "relative",
        zIndex: 2,
        alignSelf: "center",
        mt: 1,
        px: 2,
        py: 0.75,
        gap: 1,
        borderRadius: 99,
        bgcolor: theme.surface,
        color: theme.ink,
        boxShadow: 3,
      }}
    >
      <GameControllerIcon size={18} weight="fill" color={theme.marks[0]} />
      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{labelOf(session, meId, name)}</Typography>
    </ButtonBase>
  );
};

export default GamePill;
