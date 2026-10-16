import { Suspense, useState } from "react";
import { Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowsInSimple, SpeakerHigh, SpeakerSlash, Stop, Trophy, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import ConfirmDialog from "@/components/ConfirmDialog";
import useLocalStorage from "@/hooks/useLocalStorage";
import { ActInGame, AnswerInvite, CloseGame } from "@/redux/slices/actions/gameActions";
import { gameCollapsed } from "@/redux/slices/gameSlice";
import { GAMES } from "@/sections/chat/game/catalog";
import { GAME_SOUND_KEY } from "@/sections/chat/game/gameSounds";
import GamesDialog from "@/sections/chat/game/GamesDialog";
import GameSeats from "@/sections/chat/game/GameSeats";
import RoomSeats from "@/sections/chat/game/RoomSeats";
import SaveSeatDialog from "@/sections/chat/game/SaveSeatDialog";
import useSecondsLeft from "@/sections/chat/game/useSecondsLeft";
import { peerOf } from "@/utils/chats";
import { canManage, firstNameIn } from "@/utils/groups";

const twoPlayerLineOf = (session, conversation, meId) => {
  const peer = peerOf(conversation, meId);
  const mine = session.seats.find((seat) => seat.user === meId);
  const theirs = session.seats.find((seat) => seat.user === peer._id);
  if (!mine) return theirs ? `${peer.firstName} wants to play. Take the other seat.` : "Take a seat to play";
  if (!theirs) return `Waiting for ${peer.firstName} to sit down`;
  if (mine.ready) return `Waiting for ${peer.firstName} to be ready`;
  return theirs.ready ? `${peer.firstName} is ready. Are you?` : "Press Ready when you are";
};

const lobbyLineOf = (session, conversation, meId) => {
  if (!conversation.isGroup) return twoPlayerLineOf(session, conversation, meId);
  const seated = session.seats.filter((seat) => seat.user);
  if (seated.length < session.minPlayers) return "Waiting for players";
  return "Waiting for everyone to be ready";
};

const resultLineOf = ({ winners }, conversation, meId) => {
  if (!winners.length) return "It's a draw";
  const [winner] = winners;
  return winner.bot ? "The bot won" : `${firstNameIn(conversation, winner.user, meId)} won`;
};

const turnLineOf = (session, conversation, meId) => {
  const seat = session.seats[session.turn];
  if (seat.bot) return "The bot's turn";
  if (seat.user === meId) return seat.away ? "The bot is playing for you" : "Your turn";
  const name = firstNameIn(conversation, seat.user, meId);
  return seat.away ? `The bot is playing for ${name}` : `${name}'s turn`;
};

// a seat a manager saved for you, offered here as well as on the seat itself
const savedSeatOf = (session, meId) => {
  if (session.seats.some((seat) => seat.invited === meId)) return "game";
  return session.roomSeats.some((seat) => seat.invited === meId) ? "room" : null;
};

const BarButton = ({ label, onClick, children }) => (
  <Tooltip title={label}>
    <IconButton aria-label={label} onClick={onClick} sx={{ color: "inherit" }}>
      {children}
    </IconButton>
  </Tooltip>
);

const CONFIRMATIONS = {
  close: { title: "Close the game?", text: "Everyone at the table gets up and the game goes away.", action: "Close game" },
  cancel: { title: "End this game?", text: "The game stops here and everyone goes back to the table.", action: "End game" },
};

// the session comes from the panel rather than the store, so a game sliding away keeps showing its last view
const GameRoom = ({ conversation, session }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const [confirming, setConfirming] = useState(null);
  const [savingSeat, setSavingSeat] = useState(null);
  const [isShowingScores, setIsShowingScores] = useState(false);
  const [isSoundOn, setIsSoundOn] = useLocalStorage(GAME_SOUND_KEY, true);
  const secondsToStart = useSecondsLeft(session.status === "countdown" && session.startsAt);

  const game = GAMES[session.game];
  const { theme } = game;
  const conversationId = conversation._id;
  const isPlaying = session.status === "playing";
  const isManager = conversation.isGroup && canManage(conversation, meId);
  const savedSeat = savedSeatOf(session, meId);
  const canClose = !conversation.isGroup || (isManager && !isPlaying);

  const statusLine = () => {
    if (isPlaying) return turnLineOf(session, conversation, meId);
    if (session.status === "countdown") return "Starting…";
    const isAnyoneReady = session.seats.some((seat) => seat.ready);
    // the last game's result stays up until someone wants another
    if (session.result && !isAnyoneReady) return resultLineOf(session.result, conversation, meId);
    return lobbyLineOf(session, conversation, meId);
  };

  return (
    <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column", overflowY: "auto", bgcolor: theme.surface, color: theme.ink }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ pl: 2.5, pr: 1, py: 1, flexShrink: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{game.name}</Typography>
          <Typography noWrap sx={{ fontSize: 13, color: alpha(theme.ink, 0.7) }}>
            {statusLine()}
          </Typography>
        </Box>
        <BarButton label="Leaderboard" onClick={() => setIsShowingScores(true)}>
          <Trophy size={20} weight="bold" />
        </BarButton>
        <BarButton label={isSoundOn ? "Mute game sounds" : "Turn game sounds on"} onClick={() => setIsSoundOn(!isSoundOn)}>
          {isSoundOn ? <SpeakerHigh size={20} weight="bold" /> : <SpeakerSlash size={20} weight="bold" />}
        </BarButton>
        {isManager && isPlaying && (
          <BarButton label="End game" onClick={() => setConfirming("cancel")}>
            <Stop size={20} weight="bold" />
          </BarButton>
        )}
        <BarButton label="Hide game" onClick={() => dispatch(gameCollapsed(true))}>
          <ArrowsInSimple size={20} weight="bold" />
        </BarButton>
        {canClose && (
          <BarButton label="Close game" onClick={() => setConfirming("close")}>
            <X size={20} weight="bold" />
          </BarButton>
        )}
      </Stack>

      {conversation.isGroup && <RoomSeats conversation={conversation} session={session} theme={theme} meId={meId} isManager={isManager} onInvite={setSavingSeat} />}

      {/* the board takes whatever height the seats leave, so it never runs into them */}
      <Box sx={{ flex: 1, minHeight: 140, position: "relative" }}>
        <Box sx={{ position: "absolute", inset: 16, display: "grid", placeItems: "center" }}>
          <Suspense fallback={null}>
            <game.Board
              state={session.state}
              theme={theme}
              dimmed={!isPlaying && !session.result}
              onMove={(move) => dispatch(ActInGame({ conversationId, type: "move", move }))}
            />
          </Suspense>
          {secondsToStart && (
            <Typography aria-live="polite" sx={{ position: "absolute", fontSize: 88, fontWeight: 800, color: theme.marks[0] }}>
              {secondsToStart}
            </Typography>
          )}
        </Box>
      </Box>

      {savedSeat && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mx: 2, mb: 1.5, px: 2, py: 1, borderRadius: 3, bgcolor: theme.raised, flexShrink: 0 }}>
          <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}>A seat {savedSeat === "room" ? "in the room" : "at the table"} is saved for you</Typography>
          <Button size="small" sx={{ color: theme.ink }} onClick={() => dispatch(AnswerInvite({ conversationId, kind: savedSeat, accept: false }))}>
            No thanks
          </Button>
          <Button size="small" variant="contained" sx={{ bgcolor: theme.marks[0], color: theme.surface }} onClick={() => dispatch(AnswerInvite({ conversationId, kind: savedSeat, accept: true }))}>
            Take it
          </Button>
        </Stack>
      )}

      <GameSeats conversation={conversation} session={session} game={game} meId={meId} isManager={isManager} onInvite={setSavingSeat} />

      {confirming && (
        <ConfirmDialog
          {...CONFIRMATIONS[confirming]}
          onConfirm={() => dispatch(confirming === "close" ? CloseGame(conversationId) : ActInGame({ conversationId, type: confirming }))}
          onClose={() => setConfirming(null)}
        />
      )}
      {isShowingScores && <GamesDialog conversation={conversation} tab="leaderboard" onClose={() => setIsShowingScores(false)} />}
      {savingSeat && <SaveSeatDialog conversation={conversation} session={session} seat={savingSeat} meId={meId} onClose={() => setSavingSeat(null)} />}
    </Box>
  );
};

export default GameRoom;
