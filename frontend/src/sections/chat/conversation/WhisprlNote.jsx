import { useState } from "react";
import { Link } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import { gameCollapsed, selectGameSession } from "@/redux/slices/gameSlice";
import ChatNote from "@/sections/chat/conversation/ChatNote";
import { CENTRED } from "@/sections/chat/conversation/messageColumn";
import GamesDialog from "@/sections/chat/game/GamesDialog";

// Whisprl never answers, so the first message sent to it is met with what it will do instead
const WhisprlNote = ({ conversation }) => {
  const dispatch = useDispatch();
  const gameSession = useSelector(selectGameSession);
  const [isPicking, setIsPicking] = useState(false);
  const challenge = () => (gameSession ? dispatch(gameCollapsed(false)) : setIsPicking(true));

  return (
    <>
      <ChatNote sx={{ maxWidth: 340, px: 1.75, py: 1.25, borderRadius: 1.5, fontSize: 12.5, lineHeight: 1.5, ...CENTRED }}>
        Whisprl doesn't reply to messages, but it's always up for a game.{" "}
        <Link component="button" onClick={challenge} underline="hover" sx={{ font: "inherit", fontWeight: 800, verticalAlign: "baseline" }}>
          Challenge Whisprl
        </Link>
      </ChatNote>
      {isPicking && <GamesDialog conversation={conversation} onClose={() => setIsPicking(false)} />}
    </>
  );
};

export default WhisprlNote;
