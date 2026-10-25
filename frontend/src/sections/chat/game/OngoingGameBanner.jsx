import { ButtonBase, Typography } from "@mui/material";
import { CaretRightIcon, GameControllerIcon } from "@phosphor-icons/react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { chatPath } from "@/sections/chat/chatRoute";
import { GAMES } from "@/sections/chat/game/catalog";
import { peerOf } from "@/utils/chats";

const placeOf = (conversation, meId) => (conversation.isGroup ? `in ${conversation.name}` : `with ${peerOf(conversation, meId).firstName}`);

// a game still being played stays a tap away from the main pages, in its own colour, over the status bar as a call does
const OngoingGameBanner = () => {
  const navigate = useNavigate();
  const ongoing = useSelector((state) => state.game.ongoing);
  const meId = useSelector((state) => state.user.user._id);
  const conversation = useSelector((state) => state.chat.conversations.find((listed) => listed._id === ongoing?.conversationId));
  const game = GAMES[ongoing?.game];
  if (!game || !conversation) return null;
  const label = `${game.name} ${placeOf(conversation, meId)}`;

  return (
    <ButtonBase
      data-ongoing-game
      onClick={() => navigate(chatPath(conversation._id))}
      aria-label={`Back to ${label}`}
      sx={(theme) => ({
        flexShrink: 0,
        width: "100%",
        gap: 1,
        px: 2,
        pt: "calc(env(safe-area-inset-top) + 8px)",
        pb: 1,
        bgcolor: game.theme.accent,
        color: theme.palette.getContrastText(game.theme.accent),
        "&.Mui-focusVisible": { outline: `2px solid ${theme.palette.getContrastText(game.theme.accent)}`, outlineOffset: -4 },
      })}
    >
      <GameControllerIcon size={18} weight="fill" />
      <Typography noWrap sx={{ minWidth: 0, fontSize: 14, fontWeight: 700 }}>
        {label}
      </Typography>
      <CaretRightIcon size={14} weight="bold" />
    </ButtonBase>
  );
};

export default OngoingGameBanner;
