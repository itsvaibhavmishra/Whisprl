import { Suspense, useEffect, useState } from "react";
import { Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { m, useReducedMotion } from "framer-motion";
import { ArrowsInSimple, BookOpen, SpeakerHigh, Stop, Trophy, X } from "phosphor-react";
import { useDispatch, useSelector } from "react-redux";

import ConfirmDialog from "@/components/ConfirmDialog";
import { ActInGame, AnswerInvite, CloseGame } from "@/redux/slices/actions/gameActions";
import { gameCollapsed, resultDismissed } from "@/redux/slices/gameSlice";
import { GAMES } from "@/sections/chat/game/catalog";
import { applyGameLevels, gameAudioOf, startMusic, stopMusic } from "@/sections/chat/game/gameSounds";
import GameButton from "@/sections/chat/game/GameButton";
import GamesDialog from "@/sections/chat/game/GamesDialog";
import GameTitle from "@/sections/chat/game/GameTitle";
import PlayerBar from "@/sections/chat/game/PlayerBar";
import ResultPanel from "@/sections/chat/game/ResultPanel";
import RulesDialog from "@/sections/chat/game/RulesDialog";
import SaveSeatDialog from "@/sections/chat/game/SaveSeatDialog";
import SceneSparkle from "@/sections/chat/game/SceneSparkle";
import Scenery from "@/sections/chat/game/Scenery";
import SoundMenu from "@/sections/chat/game/SoundMenu";
import StartScreen from "@/sections/chat/game/StartScreen";
import StatusPill from "@/sections/chat/game/StatusPill";
import useArtReady from "@/sections/chat/game/useArtReady";
import useSceneWidth from "@/sections/chat/game/useSceneWidth";
import { turnLineOf } from "@/sections/chat/game/gameStatus";
import { canManage } from "@/utils/groups";
import { feel } from "@/utils/haptics";

const CONFIRMATIONS = {
  close: { title: "Close the game?", text: "Everyone at the table gets up and the game goes away.", action: "Close game" },
  cancel: { title: "End this game?", text: "The game stops here and everyone goes back to the table.", action: "End game" },
  leave: { title: "Leave the game?", text: "A bot plays your seat for the rest of this game.", action: "Leave" },
};

// the bar sits over the artwork, so the buttons carry their own backing, in the game's card so its ink reads on it
const controlsOf = (theme) => ({ flexShrink: 0, px: 0.25, borderRadius: 99, bgcolor: alpha(theme.card, 0.6), backdropFilter: "blur(8px)" });

const BarButton = ({ label, onClick, children }) => (
  <Tooltip title={label}>
    <IconButton aria-label={label} onClick={onClick} sx={{ color: "inherit" }}>
      {children}
    </IconButton>
  </Tooltip>
);

const hasSavedSeat = (session, meId) => session.seats.some((seat) => seat.invited === meId);

// a phone is narrower than the artwork, so it is fitted across rather than cropped at the sides
const sceneOf = (art) => ({
  backgroundImage: { xs: `url(${art.scene}), ${art.beyond}`, lg: `url(${art.scene})` },
  backgroundSize: { xs: "100% auto, 100% 100%", lg: "cover" },
  backgroundPosition: { xs: "center bottom, center top", lg: "center" },
});

const screenOf = (session, dismissedResult) => {
  if (session.status === "playing") return "playing";
  // the result holds until a new game starts, so whoever looked away still sees how it ended
  return session.result && session.result.endedAt !== dismissedResult ? "result" : "start";
};

// the session comes from the panel rather than the store, so a game sliding away keeps showing its last view
const GameRoom = ({ conversation, session }) => {
  const dispatch = useDispatch();
  const meId = useSelector((state) => state.user.user._id);
  const isStill = useReducedMotion();
  const [confirming, setConfirming] = useState(null);
  const [savingSeat, setSavingSeat] = useState(null);
  const [isShowingScores, setIsShowingScores] = useState(false);
  const [isShowingRules, setIsShowingRules] = useState(false);
  const [soundAnchor, setSoundAnchor] = useState(null);
  const dismissedResult = useSelector((state) => state.game.dismissedResult);
  // kept between screens, so the scene does not change size as a game starts and ends
  const [controlsHeight, setControlsHeight] = useState(0);

  const game = GAMES[session.game];
  const { theme } = game;
  const isArtReady = useArtReady(game.preload);
  const isAnchored = game.art.anchor === "top";
  const [roomRef, sceneWidth, isSceneNarrower] = useSceneWidth(game.art, game.mastheadRatio, controlsHeight);

  // each game remembers its own levels, so the sound and music the player chose come back with it
  const effects = useSelector((state) => gameAudioOf(state.user.user, session.game).effects);
  const music = useSelector((state) => gameAudioOf(state.user.user, session.game).music);
  useEffect(() => {
    applyGameLevels({ effects, music });
  }, [effects, music]);

  // music belongs to the open game, so it starts with the panel and stops when it closes
  useEffect(() => {
    startMusic(game.music);
    return stopMusic;
  }, [game.music]);
  const conversationId = conversation._id;
  const screen = screenOf(session, dismissedResult);
  const isPlaying = screen === "playing";

  const isManager = conversation.isGroup && canManage(conversation, meId);
  const isSeatSaved = hasSavedSeat(session, meId);
  const canClose = !conversation.isGroup || (isManager && !isPlaying);
  const mySeat = session.seats.find((seat) => seat.user === meId);

  const act = (action) => dispatch(ActInGame({ conversationId, ...action }));
  const confirmed = {
    close: () => dispatch(CloseGame(conversationId)),
    cancel: () => act({ type: "cancel" }),
    leave: () => act({ type: "stand" }),
  };

  return (
    <Stack
      ref={roomRef}
      sx={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        position: "relative",
        // the scenery sits behind everything here and above nothing outside
        isolation: "isolate",
        overflow: "hidden",
        // the artwork runs full screen on a phone, under the status bar and the chat at its foot, so only the content is inset
        pt: { xs: "env(safe-area-inset-top)", lg: 0 },
        pb: { xs: "var(--chat-overlay, 200px)", lg: 0 },
        color: theme.ink,
        bgcolor: theme.surface,
        ...(!isAnchored && sceneOf(game.art)),
        backgroundRepeat: "no-repeat",
        "--scene-width": sceneWidth ? `${sceneWidth}px` : "100%",
      }}
    >
      {isAnchored && sceneWidth && <Scenery art={game.art} width={sceneWidth} isNarrower={isSceneNarrower} />}
      <SceneSparkle fireflies={game.art.fireflies} />
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          pl: 2,
          pr: 1,
          py: 1,
          flexShrink: 0,
          // the start screen has no title in this row, so the bar floats over the art instead of taking a row of its own
          ...(screen === "start" && { position: "absolute", top: { xs: "env(safe-area-inset-top)", lg: 0 }, left: 0, right: 0, zIndex: 2 }),
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
          {screen !== "start" &&
            (game.Wordmark ? (
              <Suspense fallback={null}>
                <game.Wordmark isStatic width={150} />
              </Suspense>
            ) : (
              <GameTitle title={game.title} name={game.name} isStatic width={132} />
            ))}
        </Box>
        <Stack direction="row" alignItems="center" sx={controlsOf(theme)}>
          <BarButton label="Rules" onClick={() => setIsShowingRules(true)}>
            <BookOpen size={20} weight="bold" />
          </BarButton>
          <BarButton label="Leaderboard" onClick={() => setIsShowingScores(true)}>
            <Trophy size={20} weight="bold" />
          </BarButton>
          <BarButton label="Sound and music" onClick={(event) => setSoundAnchor(event.currentTarget)}>
            <SpeakerHigh size={20} weight="bold" />
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
      </Stack>

      {screen === "start" ? (
        <StartScreen
          conversation={conversation}
          session={session}
          game={game}
          meId={meId}
          isManager={isManager}
          isArtReady={isArtReady}
          act={act}
          onSaveSeat={setSavingSeat}
          onControlsHeight={setControlsHeight}
        />
      ) : (
        <>
          <PlayerBar conversation={conversation} session={session} game={game} meId={meId} onLeave={() => setConfirming("leave")} />
          {isPlaying && (
            <Box sx={{ pt: 1.25, display: "flex", justifyContent: "center", flexShrink: 0 }}>
              <StatusPill theme={theme} isLive>
                {turnLineOf(session, conversation, meId)}
              </StatusPill>
            </Box>
          )}
          <Box
            component={m.div}
            initial={isStill ? false : { scale: 1.06, y: -14, opacity: 0 }}
            animate={isArtReady ? { scale: 1, y: 0, opacity: 1 } : { opacity: 0 }}
            transition={isStill ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 24, delay: 0.2 }}
            sx={{ flex: 1, minHeight: 0, display: "flex" }}
          >
            <Suspense fallback={null}>
              <game.Board
                state={session.state}
                seats={session.seats}
                conversation={conversation}
                onMove={(move) => {
                  feel();
                  act({ type: "move", move });
                }}
              />
            </Suspense>
          </Box>
          {isPlaying && mySeat?.away && (
            <Stack sx={{ px: 2, pb: 2, flexShrink: 0 }}>
              <GameButton theme={theme} label="Take my seat back" onClick={() => act({ type: "back" })} />
            </Stack>
          )}
          {screen === "result" && (
            <ResultPanel conversation={conversation} session={session} game={game} meId={meId} act={act} onBack={() => dispatch(resultDismissed(session.result.endedAt))} />
          )}
        </>
      )}

      {isSeatSaved && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mx: 2, mb: 1.5, px: 2, py: 1, borderRadius: 3, bgcolor: theme.card, flexShrink: 0 }}>
          <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}>A seat at the table is saved for you</Typography>
          <Button size="small" sx={{ color: theme.ink }} onClick={() => dispatch(AnswerInvite({ conversationId, accept: false }))}>
            No thanks
          </Button>
          <Button size="small" variant="contained" sx={{ bgcolor: theme.accent, color: "#fff" }} onClick={() => dispatch(AnswerInvite({ conversationId, accept: true }))}>
            Take it
          </Button>
        </Stack>
      )}

      {confirming && (
        <ConfirmDialog {...CONFIRMATIONS[confirming]} onConfirm={confirmed[confirming]} onClose={() => setConfirming(null)} />
      )}
      {soundAnchor && <SoundMenu anchor={soundAnchor} gameId={session.game} track={game.music} onClose={() => setSoundAnchor(null)} />}
      {isShowingRules && <RulesDialog game={game} turnSeconds={session.turnSeconds} onClose={() => setIsShowingRules(false)} />}
      {isShowingScores && <GamesDialog conversation={conversation} tab="leaderboard" onClose={() => setIsShowingScores(false)} />}
      {savingSeat !== null && (
        <SaveSeatDialog conversation={conversation} session={session} index={savingSeat} meId={meId} onClose={() => setSavingSeat(null)} />
      )}
    </Stack>
  );
};

export default GameRoom;
