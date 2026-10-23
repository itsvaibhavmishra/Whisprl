import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { onRoomEvent } from "@/utils/gameRoomEvents";

const SAYING_MS = 4200;
const REACTION_MS = 2600;
export const FLOAT_MS = 7000;
// floats keep clear of the bar and players at the top and the controls at the bottom
const FLOAT_BAND = [0.22, 0.62];
const MOST_FLOATS = 6;

let nextId = 0;

// a player's words show at their seat; in a group only someone with the game on screen floats past, or the board would drown
export const placeOf = (event, { conversation, seats, lookers }) => {
  if (seats.some((seat) => seat.user === event.from && !seat.bot)) return "seat";
  if (!conversation.isGroup || lookers.includes(event.from)) return "float";
  return null;
};

const useRoomChatter = (conversation, seats) => {
  const lookers = useSelector((state) => state.game.lookers);
  const [sayings, setSayings] = useState({});
  const [floats, setFloats] = useState([]);
  const table = useRef({ conversation, seats, lookers });
  table.current = { conversation, seats, lookers };

  useEffect(() => {
    const timers = new Set();
    const later = (ms, task) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        task();
      }, ms);
      timers.add(timer);
    };

    const stop = onRoomEvent((event) => {
      if (event.conversationId !== table.current.conversation._id) return;
      const place = placeOf(event, table.current);
      const id = (nextId += 1);
      const said = { id, text: event.text, emoji: event.emoji };
      if (place === "seat") {
        setSayings((current) => ({ ...current, [event.from]: said }));
        later(event.emoji ? REACTION_MS : SAYING_MS, () =>
          setSayings((current) => (current[event.from]?.id === id ? { ...current, [event.from]: undefined } : current))
        );
      } else if (place === "float") {
        const top = FLOAT_BAND[0] + Math.random() * (FLOAT_BAND[1] - FLOAT_BAND[0]);
        setFloats((current) => [...current.slice(1 - MOST_FLOATS), { ...said, from: event.from, top }]);
        later(FLOAT_MS, () => setFloats((current) => current.filter((float) => float.id !== id)));
      }
    });
    return () => {
      stop();
      timers.forEach(clearTimeout);
    };
  }, []);

  return { sayings, floats };
};

export default useRoomChatter;
