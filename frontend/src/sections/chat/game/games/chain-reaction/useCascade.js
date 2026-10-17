import { useEffect, useRef, useState } from "react";

import { emptied, framesOf } from "@/sections/chat/game/games/chain-reaction/cascade";
import { playGameSound } from "@/sections/chat/game/gameSounds";

// a short cascade plays out in this, but a long one is never faster than the shortest round, so it stays readable
const CASCADE_MS = 1200;
const PLACE_MS = 140;
const LONGEST_ROUND_MS = 260;
const SHORTEST_ROUND_MS = 120;

// what the board shows while a move plays out: the board itself, and the orbs in flight this round
const useCascade = (state, isStill) => {
  const [shown, setShown] = useState({ board: state, flight: null });
  const previous = useRef(state);

  useEffect(() => {
    const before = previous.current;
    previous.current = state;
    const frames = isStill ? null : framesOf(before, state);
    if (!frames) {
      setShown({ board: state, flight: null });
      return undefined;
    }

    const rounds = state.bursts;
    const roundMs = Math.max(SHORTEST_ROUND_MS, Math.min(LONGEST_ROUND_MS, (CASCADE_MS - PLACE_MS) / Math.max(rounds.length, 1)));
    const { seat } = state.lastMove;
    setShown({ board: frames[0], flight: null });
    const timers = rounds.map((burst, round) =>
      setTimeout(() => {
        playGameSound("pop", round);
        setShown({ board: emptied(state, frames[round], burst), flight: { burst, seat, ms: roundMs, round } });
      }, PLACE_MS + round * roundMs)
    );
    timers.push(setTimeout(() => setShown({ board: state, flight: null }), PLACE_MS + rounds.length * roundMs));
    return () => timers.forEach(clearTimeout);
  }, [state, isStill]);

  return shown;
};

export default useCascade;
