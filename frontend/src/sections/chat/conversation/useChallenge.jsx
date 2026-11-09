import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { OpenGame } from "@/redux/slices/actions/gameActions";
import { gameCollapsed, selectGameSession } from "@/redux/slices/gameSlice";
import GamesDialog from "@/sections/chat/game/GamesDialog";

// challenging Whisprl brings back the game already on the table, or opens the one named, or the games to pick from
const useChallenge = (conversation) => {
  const dispatch = useDispatch();
  const gameSession = useSelector(selectGameSession);
  const [isPicking, setIsPicking] = useState(false);
  const challenge = (game) => {
    if (gameSession) return dispatch(gameCollapsed(false));
    return game ? dispatch(OpenGame(game)) : setIsPicking(true);
  };
  const picker = isPicking && <GamesDialog conversation={conversation} onClose={() => setIsPicking(false)} />;
  return { challenge, picker };
};

export default useChallenge;
