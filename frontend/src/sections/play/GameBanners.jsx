import { Box, ButtonBase, Typography } from "@mui/material";

import { GAMES } from "@/sections/chat/game/catalog";
import BannerFrame from "@/sections/play/BannerFrame";
import { BANNERS } from "@/sections/play/lobby";

const BANNER_GAMES = ["jackaroo", "chain-reaction", "dots-and-boxes", "tic-tac-toe"];

const GameBanner = ({ game }) => {
  const colour = BANNERS[game.id];
  return (
    <ButtonBase
      aria-label={game.name}
      sx={{
        position: "relative",
        display: "block",
        height: { xs: 76, sm: 88 },
        textAlign: "left",
        transition: "transform 140ms ease",
        "&:hover .banner-art, &.Mui-focusVisible .banner-art": { transform: "translateY(-3px) scale(1.03)" },
        "&:active": { transform: "scale(0.98)" },
        "&.Mui-focusVisible": { outline: `3px solid ${colour}`, outlineOffset: 3, borderRadius: 3 },
      }}
    >
      <BannerFrame colour={colour} />
      {/* rises out of the card's top edge, so the game seems to stand on the banner */}
      <Box
        className="banner-art"
        component="img"
        src={game.art.tile}
        alt=""
        sx={{ position: "absolute", right: "2%", bottom: 6, height: "100%", pointerEvents: "none", transition: "transform 200ms ease" }}
      />
      <Typography
        component="span"
        sx={{
          position: "absolute",
          top: "50%",
          left: "11%",
          width: "56%",
          transform: "translateY(calc(-50% - 2px))",
          fontSize: { xs: 16, sm: 19 },
          lineHeight: 1.1,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          color: "#FFFFFF",
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.18)",
        }}
      >
        {game.name}
      </Typography>
    </ButtonBase>
  );
};

const GameBanners = () => (
  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 0.5, rowGap: 2, pt: 2.25 }}>
    {BANNER_GAMES.map((id) => (
      <GameBanner key={id} game={GAMES[id]} />
    ))}
  </Box>
);

export default GameBanners;
