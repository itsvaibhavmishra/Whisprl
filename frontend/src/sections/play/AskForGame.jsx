import { useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { CaretRightIcon, GameControllerIcon } from "@phosphor-icons/react";

import RequestGameDialog from "@/sections/chat/game/RequestGameDialog";
import { lobbyOf } from "@/sections/play/lobby";

const AskForGame = () => {
  const [isAsking, setIsAsking] = useState(false);

  return (
    <>
      <ButtonBase
        onClick={() => setIsAsking(true)}
        sx={(theme) => ({
          width: "100%",
          justifyContent: "flex-start",
          gap: 1,
          px: 1.75,
          py: 1.1,
          borderRadius: 3,
          bgcolor: lobbyOf(theme).chip,
          color: lobbyOf(theme).muted,
        })}
      >
        <GameControllerIcon size={20} weight="fill" />
        <Typography sx={{ flex: 1, textAlign: "left", fontSize: 12.5, fontWeight: 600 }}>
          Have a game in mind?{" "}
          <Box component="span" sx={(theme) => ({ color: lobbyOf(theme).ink, fontWeight: 700 })}>
            Ask for it
          </Box>
        </Typography>
        <CaretRightIcon size={14} weight="bold" />
      </ButtonBase>
      {isAsking && <RequestGameDialog onClose={() => setIsAsking(false)} />}
    </>
  );
};

export default AskForGame;
