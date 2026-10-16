import { Button, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Robot } from "phosphor-react";

import GameButton from "@/sections/chat/game/GameButton";
import GameSeats from "@/sections/chat/game/GameSeats";
import GameTitle from "@/sections/chat/game/GameTitle";
import StatusPill from "@/sections/chat/game/StatusPill";
import { PRACTICE_NOTE, lobbyLineOf } from "@/sections/chat/game/gameStatus";
import { isChosenBot, mayHoldBot, mayTake } from "@/sections/chat/game/seats";
import usePendingReady from "@/sections/chat/game/usePendingReady";
import useSecondsLeft from "@/sections/chat/game/useSecondsLeft";

const BotToggle = ({ theme, label, onClick }) => (
  <Stack alignItems="center" spacing={0.25}>
    <Button
      size="small"
      startIcon={<Robot size={16} weight="duotone" />}
      onClick={onClick}
      sx={{ borderRadius: 99, px: 1.75, fontSize: 13, fontWeight: 700, color: theme.ink, "&:hover": { bgcolor: alpha(theme.ink, 0.08) } }}
    >
      {label}
    </Button>
    <Typography sx={{ fontSize: 11, fontWeight: 600, color: alpha(theme.ink, 0.62), textAlign: "center" }}>{PRACTICE_NOTE}</Typography>
  </Stack>
);

const StartScreen = ({ conversation, session, game, meId, isManager, isArtReady, act, onSaveSeat }) => {
  const { theme } = game;
  const coolingFor = useSecondsLeft(session.cooldownUntil);
  const secondsToStart = useSecondsLeft(session.status === "countdown" && session.startsAt);
  const mySeat = session.seats.find((seat) => seat.user === meId);
  const freeSeat = session.seats.findIndex((seat) => mayTake(seat, meId));
  const botSeat = session.seats.findIndex(isChosenBot);
  const seatForBot = session.seats.findIndex(mayHoldBot);
  const [isReady, toggleReady] = usePendingReady(Boolean(mySeat?.ready), (ready) => act({ type: "ready", ready }));
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
    <Stack alignItems="center" justifyContent="center" spacing={2.5} sx={{ flex: 1, minHeight: 0, px: 2, py: 1 }}>
      <GameTitle title={game.title} name={game.name} isReady={isArtReady} />
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
      <StatusPill theme={theme} isLive={Boolean(secondsToStart)}>
        {secondsToStart ? `Starting in ${secondsToStart}` : lobbyLineOf(session, conversation, meId)}
      </StatusPill>
      {next && <GameButton theme={theme} label={next.label} onClick={next.onClick} isDisabled={!next.onClick} isQuiet={next.isQuiet} isSmall />}
      {bot && <BotToggle theme={theme} label={bot.label} onClick={bot.onClick} />}
    </Stack>
  );
};

export default StartScreen;
