import { Link } from "@mui/material";

import ChatNote from "@/sections/chat/conversation/ChatNote";
import { CENTRED } from "@/sections/chat/conversation/messageColumn";
import useChallenge from "@/sections/chat/conversation/useChallenge";

// Whisprl never answers, so the first message sent to it is met with what it will do instead
const WhisprlNote = ({ conversation }) => {
  const { challenge, picker } = useChallenge(conversation);

  return (
    <>
      <ChatNote sx={{ maxWidth: 340, px: 1.75, py: 1.25, borderRadius: 1.5, fontSize: 12.5, lineHeight: 1.5, ...CENTRED }}>
        Whisprl doesn't reply to messages, but it's always up for a game.{" "}
        <Link component="button" onClick={() => challenge()} underline="hover" sx={{ font: "inherit", fontWeight: 800, verticalAlign: "baseline" }}>
          Challenge Whisprl
        </Link>
      </ChatNote>
      {picker}
    </>
  );
};

export default WhisprlNote;
