import { memo, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, ButtonBase, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, ThemeProvider } from "@mui/material/styles";
import { m, useReducedMotion } from "motion/react";
import { ArrowsInSimpleIcon, BookOpenIcon, SmileyIcon, SpeakerHighIcon, StopIcon, TrophyIcon, XIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";

import ConfirmDialog from "@/components/ConfirmDialog";
import { ActInGame, ActInGameQuietly, AnswerInvite, CloseGame } from "@/redux/slices/actions/gameActions";
import { gameCollapsed, resultDismissed, selectViewReceivedAt } from "@/redux/slices/gameSlice";
import { GAMES } from "@/sections/chat/game/catalog";
import { bodyFontOf, loadGameFonts, withBodyFont } from "@/sections/chat/game/gameFonts";
import { applyGameLevels, gameAudioOf, startMusic, stopMusic } from "@/sections/chat/game/gameSounds";
import GameButton from "@/sections/chat/game/GameButton";
import GameTitle from "@/sections/chat/game/GameTitle";
import PlayerBar from "@/sections/chat/game/PlayerBar";
import ResultPanel from "@/sections/chat/game/ResultPanel";
import ReactionTray from "@/sections/chat/game/ReactionTray";
import { Floats, SayingsContext } from "@/sections/chat/game/RoomChatter";
import RulesSheet from "@/sections/chat/game/RulesSheet";
import SaveSeatDialog from "@/sections/chat/game/SaveSeatDialog";
import SceneSparkle from "@/sections/chat/game/SceneSparkle";
import Scenery from "@/sections/chat/game/Scenery";
import ScoresSheet from "@/sections/chat/game/ScoresSheet";
import SoundMenu from "@/sections/chat/game/SoundMenu";
import StartScreen from "@/sections/chat/game/StartScreen";
import StatusPill from "@/sections/chat/game/StatusPill";
import useArtReady from "@/sections/chat/game/useArtReady";
import useRoomChatter from "@/sections/chat/game/useRoomChatter";
import useHasPassed from "@/sections/chat/game/useHasPassed";
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

// a labelled bar gives each control its own dark round button with a short name under it, as a game's design can ask
const LabelledButton = ({ label, caption, theme, onClick, children }) => (
  <ButtonBase aria-label={label} onClick={onClick} sx={{ flexDirection: "column", gap: 0.35, minWidth: 36, borderRadius: 2, color: "#fff" }}>
    <Box
      sx={{
        width: 31,
        height: 31,
        "& svg": { width: 17, height: 17 },
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        bgcolor: "rgba(16, 10, 7, 0.72)",
        border: `1px solid ${alpha(theme.outline ?? "#fff", 0.5)}`,
        boxShadow: "0 3px 10px rgba(0, 0, 0, 0.35)",
      }}
    >
      {children}
    </Box>
    {caption && <Typography sx={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1, textShadow: "0 1px 3px rgba(0, 0, 0, 0.8)" }}>{caption}</Typography>}
  </ButtonBase>
);

const BarButton = ({ label, caption = label, theme, onClick, children }) =>
  theme.bar === "labelled" ? (
    <LabelledButton label={label} caption={caption} theme={theme} onClick={onClick}>
      {children}
    </LabelledButton>
  ) : (
    <Tooltip title={label}>
      <IconButton aria-label={label} onClick={onClick} sx={{ color: "inherit" }}>
        {children}
      </IconButton>
    </Tooltip>
  );

// as wide as the widest board and its margin at most, so on a tablet or a wide panel they line up with the board instead of stretching
const BESIDE_BOARD = { width: "100%", maxWidth: 592, mx: "auto", flexShrink: 0 };

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
  const [reactionAnchor, setReactionAnchor] = useState(null);
  const dismissedResult = useSelector((state) => state.game.dismissedResult);
  const { sayings, floats } = useRoomChatter(conversation, session.seats);
  // kept between screens, so the scene does not change size as a game starts and ends
  const [controlsHeight, setControlsHeight] = useState(0);

  const game = GAMES[session.game];
  const { theme } = game;
  const isArtReady = useArtReady(game.preload);
  const isAnchored = game.art.anchor === "top";
  const isLabelled = theme.bar === "labelled";
  const [roomRef, sceneWidth, isSceneNarrower] = useSceneWidth(game.art, game.mastheadRatio, controlsHeight);

  useEffect(() => {
    loadGameFonts(theme.fonts);
  }, [theme.fonts]);
  const bodyFont = bodyFontOf(theme);
  const fontTheme = useMemo(() => bodyFont && withBodyFont(bodyFont), [bodyFont]);

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
  // the result waits for the winning play to finish showing on the board, so it never cuts it short
  const receivedAt = useSelector(selectViewReceivedAt);
  const isResultDue = useHasPassed(receivedAt + (session.result?.showsIn ?? 0));
  const isPlaying = screen === "playing";

  const isManager = conversation.isGroup && canManage(conversation, meId);
  const isSeatSaved = hasSavedSeat(session, meId);
  const canClose = !conversation.isGroup || (isManager && !isPlaying);
  const mySeat = session.seats.find((seat) => seat.user === meId);

  const act = (action) => dispatch(ActInGame({ conversationId, ...action }));
  // the board is redrawn only for what it shows, so what it is handed keeps one identity across the room's own renders
  const onMove = useCallback(
    (move, { isQuiet = false } = {}) => {
      feel();
      return dispatch((isQuiet ? ActInGameQuietly : ActInGame)({ conversationId, type: "move", move }));
    },
    [dispatch, conversationId]
  );
  const onLeave = useCallback(() => setConfirming("leave"), []);
  const confirmed = {
    close: () => dispatch(CloseGame(conversationId)),
    cancel: () => act({ type: "cancel" }),
    leave: () => act({ type: "stand" }),
  };

  const room = (
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
        // a game is taps and drags, so on the web as on a phone nothing in it selects as text, except what you type
        userSelect: "none",
        WebkitUserSelect: "none",
        "& input, & textarea": { userSelect: "text", WebkitUserSelect: "text" },
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
        spacing={1}
        sx={{
          alignItems: "center",
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
        <Stack direction="row" spacing={isLabelled ? 0.5 : 0} sx={[{ alignItems: "flex-start" }, isLabelled ? { flexShrink: 0 } : controlsOf(theme)]}>
          <BarButton label="Rules" theme={theme} onClick={() => setIsShowingRules(true)}>
            <BookOpenIcon size={20} weight="bold" />
          </BarButton>
          <BarButton label="Leaderboard" theme={theme} onClick={() => setIsShowingScores(true)}>
            <TrophyIcon size={20} weight="bold" />
          </BarButton>
          <BarButton label="Sound and music" caption="Sound" theme={theme} onClick={(event) => setSoundAnchor(event.currentTarget)}>
            <SpeakerHighIcon size={20} weight="bold" />
          </BarButton>
          {/* a phone throws emoji from the bar at its foot; beside the chat on a wide screen, it is here */}
          <Box sx={{ display: { xs: "none", lg: "inline-flex" } }}>
            <BarButton label="Throw an emoji" caption="Emoji" theme={theme} onClick={(event) => setReactionAnchor(event.currentTarget)}>
              <SmileyIcon size={20} weight="bold" />
            </BarButton>
          </Box>
          {isManager && isPlaying && (
            <BarButton label="End game" theme={theme} onClick={() => setConfirming("cancel")}>
              <StopIcon size={20} weight="bold" />
            </BarButton>
          )}
          <BarButton label="Hide game" caption="Hide" theme={theme} onClick={() => dispatch(gameCollapsed(true))}>
            <ArrowsInSimpleIcon size={20} weight="bold" />
          </BarButton>
          {canClose && (
            <BarButton label="Close game" caption="Close" theme={theme} onClick={() => setConfirming("close")}>
              <XIcon size={20} weight="bold" />
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
          {!game.drawsPlayers && (
            <Box sx={BESIDE_BOARD}>
              <PlayerBar conversation={conversation} session={session} game={game} meId={meId} onLeave={onLeave} />
            </Box>
          )}
          {isPlaying && !game.drawsPlayers && (
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
              <game.Board state={session.state} seats={session.seats} conversation={conversation} session={session} onLeave={onLeave} onMove={onMove} />
            </Suspense>
          </Box>
          {isPlaying && mySeat?.away && (
            <Stack sx={{ ...BESIDE_BOARD, px: 2, pb: 2 }}>
              <GameButton theme={theme} label="Take my seat back" onClick={() => act({ type: "back" })} />
            </Stack>
          )}
          {screen === "result" && isResultDue && (
            <Box sx={BESIDE_BOARD}>
              <ResultPanel
                conversation={conversation}
                session={session}
                game={game}
                meId={meId}
                act={act}
                onBack={() => dispatch(resultDismissed(session.result.endedAt))}
              />
            </Box>
          )}
        </>
      )}

      {isSeatSaved && (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mx: 2, mb: 1.5, px: 2, py: 1, borderRadius: 3, bgcolor: theme.card, flexShrink: 0 }}>
          <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600 }}>A seat at the table is saved for you</Typography>
          <Button size="small" sx={{ color: theme.ink }} onClick={() => dispatch(AnswerInvite({ conversationId, accept: false }))}>
            No thanks
          </Button>
          <Button
            size="small"
            variant="contained"
            sx={{ bgcolor: theme.accent, color: "#fff" }}
            onClick={() => dispatch(AnswerInvite({ conversationId, accept: true }))}
          >
            Take it
          </Button>
        </Stack>
      )}

      {confirming && <ConfirmDialog {...CONFIRMATIONS[confirming]} onConfirm={confirmed[confirming]} onClose={() => setConfirming(null)} />}
      <ReactionTray anchor={reactionAnchor} onClose={() => setReactionAnchor(null)} />
      {soundAnchor && <SoundMenu anchor={soundAnchor} gameId={session.game} track={game.music} onClose={() => setSoundAnchor(null)} />}
      {isShowingRules && <RulesSheet game={game} turnSeconds={session.turnSeconds} onClose={() => setIsShowingRules(false)} />}
      {isShowingScores && <ScoresSheet conversation={conversation} game={game} onClose={() => setIsShowingScores(false)} />}
      {savingSeat !== null && (
        <SaveSeatDialog conversation={conversation} session={session} index={savingSeat} meId={meId} onClose={() => setSavingSeat(null)} />
      )}
      <Floats floats={floats} conversation={conversation} meId={meId} theme={theme} />
    </Stack>
  );

  return <SayingsContext value={sayings}>{fontTheme ? <ThemeProvider theme={fontTheme}>{room}</ThemeProvider> : room}</SayingsContext>;
};

export default memo(GameRoom);
