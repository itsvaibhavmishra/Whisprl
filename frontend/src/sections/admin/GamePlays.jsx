import { Box, Stack, Typography } from "@mui/material";

import { GAMES, GAME_IDS } from "@/sections/chat/game/catalog";

const countOf = (count, one, many) => `${count.toLocaleString()} ${count === 1 ? one : many}`;

// every game is listed, so one nobody played shows as nobody playing it rather than going missing
const GamePlays = ({ rows }) => {
  const byGame = new Map(rows.map((row) => [row.game, row]));
  const mostPlays = Math.max(1, ...rows.map((row) => row.plays));

  return (
    <Box component="ul" sx={{ m: 0, mt: 1, p: 0, listStyle: "none" }}>
      {GAME_IDS.map((id) => {
        const { plays = 0, players = 0 } = byGame.get(id) ?? {};
        return (
          <Box key={id} component="li" sx={{ py: 1.5, borderTop: 1, borderColor: "divider" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
              <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 700 }}>
                {GAMES[id].name}
              </Typography>
              <Typography sx={{ flexShrink: 0, fontSize: 13, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
                {plays ? `${countOf(plays, "play", "plays")} by ${countOf(players, "person", "people")}` : "Not played"}
              </Typography>
            </Stack>
            <Box sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}>
              <Box sx={{ width: `${(plays / mostPlays) * 100}%`, height: "100%", borderRadius: 3, bgcolor: "primary.main" }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default GamePlays;
