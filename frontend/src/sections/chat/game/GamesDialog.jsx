import { useState } from "react";
import { Box, Button, Dialog, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import SearchPill from "@/components/SearchPill";
import { OpenGame } from "@/redux/slices/actions/gameActions";
import { selectGameSession } from "@/redux/slices/gameSlice";
import ClosableTitle from "@/sections/chat/game/ClosableTitle";
import GameCard from "@/sections/chat/game/GameCard";
import Leaderboard from "@/sections/chat/game/Leaderboard";
import RequestGameCard from "@/sections/chat/game/RequestGameCard";
import RequestGameDialog from "@/sections/chat/game/RequestGameDialog";
import { GAMES, GAME_IDS } from "@/sections/chat/game/catalog";
import { canManage } from "@/utils/groups";

const reasonCannotStart = (conversation, session, meId) => {
  if (conversation.isGroup && !canManage(conversation, meId)) return "The group's owner and admins start games";
  if (session && !conversation.isGroup) return "Close the game that's open to start another";
  if (session?.status === "playing") return "Wait for the game being played to finish";
  return null;
};

// one game a row on a phone, two on a tablet, four on a desktop
const COLUMNS = { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" };

// spaces and punctuation are left out, so "tic tac toe" and "tictactoe" both find Tic-tac-toe
const plain = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

const matches = (game, query) => plain([game.name, game.summary, ...game.keywords].join(" ")).includes(plain(query));

const GameList = ({ conversation, onClose }) => {
  const dispatch = useDispatch();
  const session = useSelector(selectGameSession);
  const meId = useSelector((state) => state.user.user._id);
  const [query, setQuery] = useState("");
  const [requesting, setRequesting] = useState(null);
  const blocker = reasonCannotStart(conversation, session, meId);
  const shown = GAME_IDS.filter((id) => matches(GAMES[id], query));

  const open = (game) => {
    dispatch(OpenGame(game));
    onClose();
  };

  return (
    <Stack spacing={2} sx={{ px: 3, pt: 2, pb: 3 }}>
      <SearchPill value={query} onChange={setQuery} label="Search games" sx={{ maxWidth: { sm: 360 } }} />
      {blocker && <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{blocker}</Typography>}
      {shown.length ? (
        <Box sx={{ display: "grid", gridTemplateColumns: COLUMNS, gap: 2 }}>
          {shown.map((id) => (
            <GameCard key={id} game={GAMES[id]} isDisabled={Boolean(blocker)} onClick={() => open(id)} />
          ))}
          <RequestGameCard onClick={() => setRequesting("")} />
        </Box>
      ) : (
        <Stack spacing={1.5} sx={{ alignItems: "center", py: 5, textAlign: "center" }}>
          <Typography sx={{ color: "text.secondary" }}>{`No game matches "${query.trim()}"`}</Typography>
          <Button variant="outlined" onClick={() => setRequesting(query.trim())}>{`Request "${query.trim()}"`}</Button>
        </Stack>
      )}
      {requesting !== null && <RequestGameDialog initialName={requesting} onClose={() => setRequesting(null)} />}
    </Stack>
  );
};

const GamesDialog = ({ conversation, tab: initialTab = "games", onClose }) => {
  const [tab, setTab] = useState(initialTab);

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth={false}
      slotProps={{ paper: { sx: { width: { sm: 760, lg: 1180 }, maxWidth: "calc(100% - 32px)", mx: 2 } } }}
    >
      <ClosableTitle title="Play a game" onClose={onClose} sx={{ pb: 0 }} />
      <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ px: 3 }}>
        <Tab value="games" label="Games" />
        <Tab value="leaderboard" label="Leaderboard" />
      </Tabs>
      {tab === "games" ? <GameList conversation={conversation} onClose={onClose} /> : <Leaderboard conversation={conversation} />}
    </Dialog>
  );
};

export default GamesDialog;
