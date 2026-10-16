import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { GameController } from "phosphor-react";

import GameTitle from "@/sections/chat/game/GameTitle";
import useArtReady from "@/sections/chat/game/useArtReady";

// the card is the game's own scene and title, so choosing a game already looks like the game it opens
const GameCard = ({ game, isDisabled, onClick }) => {
  const { theme } = game;
  const isArtReady = useArtReady([game.art.scene, ...game.title.words.map(({ src }) => src)]);

  return (
    <ButtonBase
      disabled={isDisabled}
      onClick={onClick}
      aria-label={`Play ${game.name}. ${game.summary}`}
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 10",
        display: "block",
        borderRadius: 4,
        overflow: "hidden",
        textAlign: "left",
        bgcolor: theme.surface,
        boxShadow: `0 10px 28px ${alpha(theme.ink, 0.28)}`,
        "&.Mui-disabled": { opacity: 0.55 },
        "&:hover .game-scene": { transform: "scale(1.04)" },
        "&.Mui-focusVisible": { outline: `3px solid ${theme.accent}`, outlineOffset: 2 },
      }}
    >
      <Box
        className="game-scene"
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${game.art.scene})`,
          backgroundSize: "cover",
          backgroundPosition: "center 14%",
          opacity: isArtReady ? 1 : 0,
          transition: "opacity 300ms ease, transform 400ms ease",
        }}
      />
      <Box aria-hidden sx={{ position: "absolute", top: "9%", left: "5%", width: "58%" }}>
        <GameTitle title={game.title} name={game.name} width="100%" isReady={isArtReady} />
      </Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          position: "absolute",
          left: 10,
          right: 10,
          bottom: 10,
          pl: 1.75,
          pr: 0.75,
          py: 0.75,
          borderRadius: 99,
          bgcolor: theme.card,
          backdropFilter: "blur(8px)",
          color: theme.ink,
        }}
      >
        <Typography noWrap sx={{ flex: 1, fontSize: 13, fontWeight: 700 }}>
          {game.summary}
        </Typography>
        <Stack
          aria-hidden
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{ px: 1.75, py: 0.75, borderRadius: 99, bgcolor: theme.accent, color: "#fff", fontSize: 13, fontWeight: 800, flexShrink: 0 }}
        >
          <GameController size={16} weight="fill" />
          <span>Play</span>
        </Stack>
      </Stack>
    </ButtonBase>
  );
};

export default GameCard;
