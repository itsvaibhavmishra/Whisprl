import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { ActInGame, GetLeaderboard } from "@/redux/slices/actions/gameActions";
import { selectGameSession } from "@/redux/slices/gameSlice";
import GameCard from "@/sections/chat/game/GameCard";
import { GAMES, GAME_IDS } from "@/sections/chat/game/catalog";
import getAvatar from "@/utils/avatars";
import { canManage, firstNameIn, memberOf } from "@/utils/groups";

const reasonCannotStart = (conversation, session, meId) => {
  if (conversation.isGroup && !canManage(conversation, meId)) return "The group's owner and admins start games";
  if (session && !conversation.isGroup) return "Close the game that's open to start another";
  if (session?.status === "playing") return "Wait for the game being played to finish";
  return null;
};

const GameList = ({ conversation, onClose }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectGameSession);
  const meId = useSelector((state) => state.user.user._id);
  const blocker = reasonCannotStart(conversation, session, meId);

  const open = (game) => {
    dispatch(ActInGame({ conversationId: conversation._id, type: "open", game }));
    onClose();
  };

  return (
    <Stack spacing={2} sx={{ px: 3, pt: 2, pb: 3 }}>
      {blocker && <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{blocker}</Typography>}
      {GAME_IDS.map((id) => (
        <GameCard key={id} game={GAMES[id]} isDisabled={Boolean(blocker)} onClick={() => open(id)} />
      ))}
    </Stack>
  );
};

const STATS = ["won", "drawn", "lost"];

const Scores = ({ conversation, rows, meId }) => (
  <Table size="small" aria-label="Scores">
    <TableHead>
      <TableRow>
        <TableCell>Player</TableCell>
        {STATS.map((stat) => (
          <TableCell key={stat} align="right" sx={{ textTransform: "capitalize" }}>
            {stat}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => {
        const member = memberOf(conversation, row.user);
        return (
          <TableRow key={row.user}>
            <TableCell>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                {getAvatar(member?.avatar, member?.firstName, 28)}
                <Typography noWrap sx={{ fontSize: 14, fontWeight: row.user === meId ? 800 : 600 }}>
                  {firstNameIn(conversation, row.user, meId)}
                </Typography>
              </Stack>
            </TableCell>
            {STATS.map((stat) => (
              <TableCell key={stat} align="right" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: stat === "won" ? 800 : 500 }}>
                {row[stat]}
              </TableCell>
            ))}
          </TableRow>
        );
      })}
    </TableBody>
  </Table>
);

const Leaderboard = ({ conversation }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const leaderboard = useSelector((state) => state.game.leaderboard);
  const isLoading = useIsLoading(GetLeaderboard);
  const rows = leaderboard?.conversationId === conversation._id ? leaderboard.rows : null;

  useEffect(() => {
    dispatch(GetLeaderboard(conversation._id));
  }, [dispatch, conversation._id]);

  if (!rows) {
    return <Box sx={{ display: "grid", placeItems: "center", py: 5 }}>{isLoading && <CircularProgress size={24} />}</Box>;
  }
  const played = GAME_IDS.filter((id) => rows.some((row) => row.game === id));
  if (!played.length) {
    return <Typography sx={{ px: 3, py: 4, textAlign: "center", color: "text.secondary" }}>No games finished here yet. Scores show up after the first one.</Typography>;
  }
  return (
    <Stack spacing={2.5} sx={{ px: 1.5, pt: 1, pb: 2 }}>
      {played.map((id) => (
        <Box key={id}>
          <Typography sx={{ px: 1.5, pb: 0.5, fontSize: 14, fontWeight: 800 }}>{GAMES[id].name}</Typography>
          <Scores conversation={conversation} rows={rows.filter((row) => row.game === id)} meId={meId} />
        </Box>
      ))}
    </Stack>
  );
};

const GamesDialog = ({ conversation, tab: initialTab = "games", onClose }) => {
  const [tab, setTab] = useState(initialTab);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 0 }}>Play a game</DialogTitle>
      <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ px: 3 }}>
        <Tab value="games" label="Games" />
        <Tab value="leaderboard" label="Leaderboard" />
      </Tabs>
      {tab === "games" ? <GameList conversation={conversation} onClose={onClose} /> : <Leaderboard conversation={conversation} />}
    </Dialog>
  );
};

export default GamesDialog;
