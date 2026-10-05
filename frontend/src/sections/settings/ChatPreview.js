import { Box } from "@mui/material";
import { useSelector } from "react-redux";

import { bubbleShape, ChatWindow } from "@/sections/welcome/HeroConversation";
import useSettings from "@/hooks/useSettings";
import { ACCENT_NAMES, MODES } from "@/components/AppearancePickers";

const ChatPreview = () => {
  const { firstName } = useSelector((state) => state.user.user);
  const { themeMode, themeColorPresets } = useSettings();

  const messages = [
    { mine: false, text: `Hi ${firstName}! Pick a look and this chat changes with it.` },
    { mine: true, text: `Trying ${ACCENT_NAMES[themeColorPresets]} ${MODES[themeMode].phrase}.` },
    { mine: false, text: "Suits you." },
  ];

  return (
    <ChatWindow label="A preview of your chats with these settings">
      {messages.map(({ mine, text }) => (
        <Box component="li" key={text} sx={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
          <Box sx={bubbleShape(mine)}>{text}</Box>
        </Box>
      ))}
    </ChatWindow>
  );
};

export default ChatPreview;
