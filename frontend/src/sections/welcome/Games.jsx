import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import GameCard from "@/sections/chat/game/GameCard";
import { GAMES, GAME_IDS } from "@/sections/chat/game/catalog";
import { PATH_AUTH } from "@/routes/paths";
import { sectionHeading, sectionIntro, sectionSpacing } from "@/sections/welcome/styles";

const SHOWN = GAME_IDS.filter((id) => !GAMES[id].modeOf);

const Games = () => {
  const navigate = useNavigate();

  return (
    <Box component="section" aria-labelledby="games-title" sx={sectionSpacing}>
      <Typography id="games-title" component="h2" sx={sectionHeading}>
        Games, right in your chats
      </Typography>
      <Typography sx={sectionIntro}>
        Start a game inside any chat and keep talking while you play. Take on a friend, your whole group or one of Whisprl&apos;s bots, and climb each
        game&apos;s leaderboard.
      </Typography>

      <Box
        component="ul"
        sx={{
          listStyle: "none",
          p: 0,
          m: 0,
          mt: { xs: 5, md: 7 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: { xs: 2, md: 3 },
        }}
      >
        {SHOWN.map((id) => (
          <Box component="li" key={id}>
            <GameCard game={GAMES[id]} onClick={() => navigate(PATH_AUTH.general.login)} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Games;
