import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { gameCollapsed, selectGameSession } from "@/redux/slices/gameSlice";
import GamesDialog from "@/sections/chat/game/GamesDialog";

// challenging Whisprl brings back the game already on the table, or opens the games to pick from
const useChallenge = (conversation) => {
  const dispatch = useDispatch();
  const gameSession = useSelector(selectGameSession);
  const [isPicking, setIsPicking] = useState(false);
  const challenge = () => (gameSession ? dispatch(gameCollapsed(false)) : setIsPicking(true));
  const picker = isPicking && <GamesDialog conversation={conversation} onClose={() => setIsPicking(false)} />;
  return { challenge, picker };
};

export default useChallenge;
