import { useEffect } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { m, useReducedMotion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";

import { GetLeaderboard } from "@/redux/slices/actions/gameActions";
import GameButton from "@/sections/chat/game/GameButton";
import { PRACTICE_NOTE, resultLineOf } from "@/sections/chat/game/gameStatus";
import { isChosenBot } from "@/sections/chat/game/seats";
import usePending from "@/sections/chat/game/usePending";
import useSecondsLeft from "@/sections/chat/game/useSecondsLeft";
import { firstNameIn } from "@/utils/groups";

// a head to head reads only when two people played it, so a fuller table waits for a game with more seats
const headToHead = (leaderboard, conversation, session, gameId) => {
  if (leaderboard?.conversationId !== conversation._id || session.seats.length !== 2) return null;
  const rows = session.seats.map((seat) => leaderboard.rows.find((row) => row.game === gameId && row.user === seat.user));
  return rows.every(Boolean) ? rows : null;
};

const tallyOf = (colour) => ({ fontSize: 12, fontWeight: 800, color: colour, fontVariantNumeric: "tabular-nums" });

const Score = ({ rows, conversation, theme, meId }) => {
  const [first, second] = rows;
  const decided = first.won + second.won;
  const nameOf = (row) => firstNameIn(conversation, row.user, meId);

  return (
    <Stack alignItems="center" spacing={0.6}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
        <Typography noWrap sx={tallyOf(theme.marks[0])}>{`${nameOf(first)} ${first.won}`}</Typography>
        <Box sx={{ flex: 1, height: 7, display: "flex", borderRadius: 99, overflow: "hidden", bgcolor: alpha(theme.ink, 0.18) }}>
          {rows.map((row, index) => (
            <Box key={row.user} sx={{ width: `${decided ? (row.won / decided) * 100 : 50}%`, bgcolor: theme.marks[index] }} />
          ))}
        </Box>
        <Typography noWrap sx={tallyOf(theme.marks[1])}>{`${second.won} ${nameOf(second)}`}</Typography>
      </Stack>
      {first.drawn > 0 && (
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: alpha(theme.ink, 0.65) }}>
          {first.drawn === 1 ? "1 draw" : `${first.drawn} draws`}
        </Typography>
      )}
    </Stack>
  );
};

// the board stays on screen above this, because the board is the result
const ResultPanel = ({ conversation, session, game, meId, act, onBack }) => {
  const dispatch = useDispatch();
  const isStill = useReducedMotion();
  const leaderboard = useSelector((state) => state.game.leaderboard);
  const secondsToStart = useSecondsLeft(session.status === "countdown" && session.startsAt);
  const mySeat = session.seats.find((seat) => seat.user === meId);
  const conversationId = conversation._id;
  const { theme } = game;
  const [isReady, setReady] = usePending(Boolean(mySeat?.ready), (ready) => act({ type: "ready", ready }));
  const toggleReady = () => setReady(!isReady);

  useEffect(() => {
    dispatch(GetLeaderboard(conversationId));
  }, [dispatch, conversationId]);

  const rows = headToHead(leaderboard, conversation, session, game.id);

  const rematchLabel = () => {
    if (secondsToStart) return `Starting in ${secondsToStart}`;
    return isReady ? "Not ready" : "Play again";
  };

  return (
    <Stack
      component={m.div}
      initial={isStill ? false : { y: 36, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={isStill ? { duration: 0 } : { duration: 0.34, ease: [0.32, 0.72, 0, 1], delay: 0.26 }}
      spacing={1.5}
      sx={{ flexShrink: 0, mx: 1.5, mb: 1.5, px: 2, py: 1.75, borderRadius: 5, bgcolor: theme.card, color: theme.ink, boxShadow: "0 -4px 26px rgba(60, 38, 100, 0.26)" }}
    >
      <Typography sx={{ fontSize: 19, fontWeight: 800 }}>{resultLineOf(session.result, conversation, meId)}</Typography>
      {rows && <Score rows={rows} conversation={conversation} theme={theme} meId={meId} />}
      {session.seats.some(isChosenBot) && (
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: alpha(theme.ink, 0.65) }}>{PRACTICE_NOTE}</Typography>
      )}
      <Stack direction="row" spacing={1}>
        {mySeat && (
          <GameButton
            theme={theme}
            label={rematchLabel()}
            onClick={toggleReady}
            isDisabled={Boolean(secondsToStart)}
            isQuiet={isReady && !secondsToStart}
            isFull
          />
        )}
        <GameButton theme={theme} label="Back" onClick={onBack} isQuiet isFull={!mySeat} />
      </Stack>
    </Stack>
  );
};

export default ResultPanel;
