import { useEffect, useRef } from "react";

import { GAMES } from "@/sections/chat/game/catalog";
import { playGameSound } from "@/sections/chat/game/gameSounds";
import useSecondsLeft from "@/sections/chat/game/useSecondsLeft";

const resultCueOf = (session, meId) => {
  const { winners } = session.result;
  if (!winners.length) return "drawn";
  if (winners.some((winner) => winner.user === meId && !winner.bot)) return "won";
  return session.seats.some((seat) => seat.user === meId) ? "lost" : "won";
};

// only what changed between two views gets a sound, so a reconnect replaying the same view stays quiet
const cuesBetween = (before, session, meId) => {
  if (!before || !session || before.game !== session.game) return [];
  if (before.status !== "playing") return session.status === "playing" ? ["start"] : [];

  const game = GAMES[session.game];
  // a game may sound a move by what it did, as a closed box does
  const moveCue = typeof game.moveSound === "function" ? game.moveSound(before.state, session.state) : game.moveSound;
  const moved = game.moveCountOf(session.state) > game.moveCountOf(before.state) ? [moveCue] : [];
  if (session.status !== "playing") return session.result ? [...moved, resultCueOf(session, meId)] : moved;
  const isMyTurnNow = session.turn !== before.turn && session.seats[session.turn]?.user === meId;
  return isMyTurnNow ? [...moved, "yourTurn"] : moved;
};

const useGameSounds = (session, meId) => {
  const previous = useRef(session);
  const secondsToStart = useSecondsLeft(session?.status === "countdown" && session.startsAt);

  useEffect(() => {
    if (secondsToStart) playGameSound("tick");
  }, [secondsToStart]);

  useEffect(() => {
    cuesBetween(previous.current, session, meId).forEach(playGameSound);
    previous.current = session;
  }, [session, meId]);
};

export default useGameSounds;
