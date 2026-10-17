import { Suspense, useEffect, useRef } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { HourglassMedium, Info, Robot } from "phosphor-react";

import GameButton from "@/sections/chat/game/GameButton";
import GameOptions from "@/sections/chat/game/GameOptions";
import GameSeats from "@/sections/chat/game/GameSeats";
import GameTitle from "@/sections/chat/game/GameTitle";
import PlayerCount from "@/sections/chat/game/PlayerCount";
import StatusPill from "@/sections/chat/game/StatusPill";
import { PRACTICE_NOTE, lobbyLineOf } from "@/sections/chat/game/gameStatus";
import { isChosenBot, mayHoldBot, mayTake } from "@/sections/chat/game/seats";
import { ON_SCRIM, ON_SCRIM_SOFT } from "@/sections/chat/game/scrim";
import usePending from "@/sections/chat/game/usePending";
import useSecondsLeft from "@/sections/chat/game/useSecondsLeft";

// a wash rather than a card: full width so it has no side edges, and faded at both ends so it has no top or bottom one
const scrimOf = (shade) => ({
  width: "100%",
  flexShrink: 0,
  // the seats tuck just under the pad's foot, as in the design, rather than starting below the art
  mt: -5,
  pt: 3.6,
  background: `linear-gradient(180deg, rgba(${shade}, 0) 0%, rgba(${shade}, 0.58) 14%, rgba(${shade}, 0.74) 50%, rgba(${shade}, 0.62) 86%, rgba(${shade}, 0) 100%)`,
});

// the design's proportions: the controls take three quarters of the width, the actions about half
const CONTROLS = { width: "min(76%, 400px)", mx: "auto", alignItems: "center" };

const ACTIONS = { width: "min(70%, 290px)", alignItems: "stretch" };

const BotToggle = ({ label, onClick }) => (
  <Button
    variant="outlined"
    startIcon={<Robot size={18} weight="bold" />}
    onClick={onClick}
    sx={{
      py: 0.55,
      borderRadius: 99,
      fontSize: 13,
      fontWeight: 700,
      color: ON_SCRIM,
      borderColor: alpha("#fff", 0.38),
      borderWidth: 1.5,
      "&:hover": { borderWidth: 1.5, borderColor: alpha("#fff", 0.7), bgcolor: alpha("#fff", 0.08) },
    }}
  >
    {label}
  </Button>
);

const PracticeNote = () => (
  <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.6} sx={{ color: ON_SCRIM_SOFT }}>
    <Info size={14} weight="bold" />
    <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{PRACTICE_NOTE}</Typography>
  </Stack>
);

// the masthead takes the panel's scene width, which can be wider than the panel and is cropped evenly at both sides
const MASTHEAD = { width: "var(--scene-width, 100%)", alignSelf: "center", flexShrink: 0 };

const StartScreen = ({ conversation, session, game, meId, isManager, isArtReady, act, onSaveSeat, onControlsHeight }) => {
  const { theme } = game;
  const controlsRef = useRef(null);

  // the room sizes its scene by how much the controls need, which only they can say
  useEffect(() => {
    const node = controlsRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() => onControlsHeight(node.offsetHeight));
    observer.observe(node);
    return () => observer.disconnect();
  }, [onControlsHeight]);

  const coolingFor = useSecondsLeft(session.cooldownUntil);
  const secondsToStart = useSecondsLeft(session.status === "countdown" && session.startsAt);
  const mySeat = session.seats.find((seat) => seat.user === meId);
  const freeSeat = session.seats.findIndex((seat) => mayTake(seat, meId));
  const botSeat = session.seats.findIndex(isChosenBot);
  const seatForBot = session.seats.findIndex(mayHoldBot);
  const [isReady, setReady] = usePending(Boolean(mySeat?.ready), (ready) => act({ type: "ready", ready }));
  const toggleReady = () => setReady(!isReady);
  // the same people the server lets set the table up: whoever is sitting, or a group's manager
  const canChangeTable = Boolean(mySeat) || isManager;
  const canChangeCount = conversation.isGroup && isManager && session.players.max > session.players.min && !secondsToStart;
  // the tick moves with the tap, so the seats show the intent rather than the last word from the server
  const seatsShown = mySeat ? session.seats.map((seat) => (seat.user === meId ? { ...seat, ready: isReady } : seat)) : session.seats;

  const takeSeat = (index) => act({ type: "sit", index });

  const nextAction = () => {
    if (coolingFor) return { label: `You can sit again in ${coolingFor}s` };
    if (!mySeat) return freeSeat === -1 ? null : { label: "Take a seat", onClick: () => takeSeat(freeSeat) };
    return { label: isReady ? "Not ready" : "Ready", onClick: toggleReady, isQuiet: isReady };
  };

  const botAction = () => {
    if (!mySeat || secondsToStart) return null;
    if (botSeat !== -1) return { label: "Remove the bot", onClick: () => act({ type: "bot", index: botSeat, seated: false }) };
    return seatForBot === -1 ? null : { label: "Play the bot instead", onClick: () => act({ type: "bot", index: seatForBot, seated: true }) };
  };

  const next = nextAction();
  const bot = botAction();

  return (
    <Stack sx={{ flex: 1, minHeight: 0, overflowX: "hidden", overflowY: "auto" }}>
      {game.Masthead ? (
        <Box sx={{ ...MASTHEAD, aspectRatio: String(game.mastheadRatio) }}>
          <Suspense fallback={null}>
            <game.Masthead title={game.title} name={game.name} isReady={isArtReady} />
          </Suspense>
        </Box>
      ) : (
        // takes whatever height the controls leave, so the title sits centred above them
        <Box sx={{ flex: "1 1 auto", minHeight: 120, display: "grid", placeItems: "center", px: 2, pt: 1 }}>
          <GameTitle title={game.title} name={game.name} isReady={isArtReady} width="min(62%, 340px)" />
        </Box>
      )}
      <Box ref={controlsRef} sx={scrimOf(theme.shade)}>
        <Stack spacing={0.9} sx={CONTROLS}>
          <GameSeats
            conversation={conversation}
            session={{ ...session, seats: seatsShown }}
            game={game}
            meId={meId}
            isManager={isManager}
            act={act}
            onTake={!mySeat && !coolingFor ? takeSeat : null}
            onLeave={() => act({ type: "stand" })}
            onSaveSeat={onSaveSeat}
          />
          {canChangeCount && <PlayerCount game={game} session={session} onChange={(count) => act({ type: "seats", count })} />}
          <GameOptions
            game={game}
            session={session}
            canChange={canChangeTable && !secondsToStart}
            onChange={(options) => act({ type: "settings", options })}
          />
          <StatusPill theme={theme} isLive={Boolean(secondsToStart)} isWide icon={<HourglassMedium size={16} weight="fill" />}>
            {secondsToStart ? `Starting in ${secondsToStart}` : lobbyLineOf(session, conversation, meId)}
          </StatusPill>
          <Stack spacing={0.85} sx={ACTIONS}>
            {next && <GameButton theme={theme} label={next.label} onClick={next.onClick} isDisabled={!next.onClick} isQuiet={next.isQuiet} isSmall isFull />}
            {bot && <BotToggle label={bot.label} onClick={bot.onClick} />}
          </Stack>
          {bot && <PracticeNote />}
        </Stack>
      </Box>
    </Stack>
  );
};

export default StartScreen;
