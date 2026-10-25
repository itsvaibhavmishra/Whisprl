import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { GameControllerIcon } from "@phosphor-icons/react";

import GameTitle from "@/sections/chat/game/GameTitle";
import useArtReady from "@/sections/chat/game/useArtReady";

const FOOT_SHADE = "linear-gradient(180deg, rgba(10, 8, 26, 0) 42%, rgba(10, 8, 26, 0.5) 64%, rgba(10, 8, 26, 0.9) 100%)";

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
        // every scene is drawn tall, so a card in the grid stands up to show it; a phone's single row lies down
        aspectRatio: { xs: "16 / 10", sm: "4 / 5" },
        display: "block",
        borderRadius: 4,
        overflow: "hidden",
        textAlign: "left",
        bgcolor: theme.surface,
        boxShadow: `0 10px 28px ${alpha(theme.ink, 0.28)}`,
        "&.Mui-disabled": { opacity: 0.55 },
        "&:hover .game-scene": { transform: "scale(1.04)" },
        "&:hover .game-play": { transform: "translateY(-1px)", boxShadow: `0 8px 20px ${alpha(theme.accent, 0.6)}` },
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
          backgroundPosition: { xs: "center 14%", sm: "center top" },
          opacity: isArtReady ? 1 : 0,
          transition: "opacity 300ms ease, transform 400ms ease",
        }}
      />
      {/* centred above the summary on a standing card unless the game places it, top left on a phone's wide card */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: { xs: "9%", sm: game.cardTitleTop ?? "6%" },
          left: { xs: "5%", sm: "10%" },
          width: { xs: "58%", sm: "80%" },
          bottom: { sm: game.cardTitleTop ? "auto" : "36%" },
          display: { sm: "flex" },
          alignItems: "center",
        }}
      >
        <GameTitle title={game.title} name={game.name} width="100%" isReady={isArtReady} />
      </Box>
      {/* the art runs to the card's edges and darkens toward its foot, so the words sit on the scene rather than in a box over it */}
      <Box aria-hidden sx={{ position: "absolute", inset: 0, background: FOOT_SHADE, pointerEvents: "none" }} />
      <Stack
        direction={{ xs: "row", sm: "column" }}
        spacing={{ xs: 1.5, sm: 1.25 }}
        sx={{ alignItems: { xs: "flex-end", sm: "flex-start" }, position: "absolute", left: 16, right: 16, bottom: 16, color: "#fff" }}
      >
        <Typography
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: 13.5,
            fontWeight: 600,
            lineHeight: 1.35,
            textShadow: "0 1px 4px rgba(0, 0, 0, 0.55)",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: { xs: 2, sm: 3 },
            overflow: "hidden",
          }}
        >
          {game.summary}
        </Typography>
        <Stack
          aria-hidden
          className="game-play"
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: "center",
            px: 2,
            py: 0.8,
            borderRadius: 99,
            bgcolor: theme.accent,
            color: "#fff",
            fontSize: 13,
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: `0 6px 16px ${alpha(theme.accent, 0.45)}`,
            transition: "transform 160ms ease, box-shadow 160ms ease",
          }}
        >
          <GameControllerIcon size={16} weight="fill" />
          <span>Play</span>
        </Stack>
      </Stack>
    </ButtonBase>
  );
};

export default GameCard;
