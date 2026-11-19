import { Box, ButtonBase, Stack, Typography } from "@mui/material";

import { GAMES } from "@/sections/chat/game/catalog";
import { lobbyOf } from "@/sections/play/lobby";
import { PREVIEW } from "@/sections/play/preview";

const GameChip = ({ game }) => (
  <ButtonBase
    sx={(theme) => ({
      flexShrink: 0,
      gap: 0.5,
      height: 30,
      pl: 0.5,
      pr: 1.5,
      borderRadius: 2.5,
      fontSize: 12.5,
      fontWeight: 600,
      color: lobbyOf(theme).ink,
      bgcolor: lobbyOf(theme).chip,
    })}
  >
    <Box component="img" src={game.art.icon} alt="" sx={{ width: 24, height: 24 }} />
    {game.name}
  </ButtonBase>
);

// runs to the page's edges, so a row longer than the screen scrolls out from under them
const RecentlyPlayed = () => (
  <Stack
    direction="row"
    spacing={1}
    sx={{ alignItems: "center", mx: -2, px: 2, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
  >
    <Typography component="h2" sx={(theme) => ({ m: 0, flexShrink: 0, fontSize: 12.5, fontWeight: 500, color: lobbyOf(theme).muted })}>
      Recently played :
    </Typography>
    {PREVIEW.recentGames.map((id) => (
      <GameChip key={id} game={GAMES[id]} />
    ))}
  </Stack>
);

export default RecentlyPlayed;
