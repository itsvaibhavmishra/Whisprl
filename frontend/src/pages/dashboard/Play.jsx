import { Box, Stack, Typography } from "@mui/material";

import { PAGE_HEIGHT_WITH_TAB_BAR } from "@/layouts/dashboard/NavRail";
import AskForGame from "@/sections/play/AskForGame";
import GameBanners from "@/sections/play/GameBanners";
import { lobbyOf } from "@/sections/play/lobby";
import PlayHeader from "@/sections/play/PlayHeader";
import RecentlyPlayed from "@/sections/play/RecentlyPlayed";
import ShortcutBadges from "@/sections/play/ShortcutBadges";

const Play = () => (
  <Box
    component="main"
    sx={(theme) => ({
      flexGrow: 1,
      minWidth: 0,
      height: { xs: PAGE_HEIGHT_WITH_TAB_BAR, md: "100dvh" },
      overflowY: "auto",
      bgcolor: lobbyOf(theme).page,
    })}
  >
    <Stack
      sx={{
        minHeight: "100%",
        maxWidth: { xs: 600, lg: 960 },
        mx: "auto",
        px: 2,
        pt: "calc(14px + var(--status-bar-room, env(safe-area-inset-top)))",
        pb: 2.5,
      }}
    >
      <PlayHeader />
      <Box sx={{ mt: 2.5 }}>
        <ShortcutBadges />
      </Box>
      <Typography component="h1" sx={(theme) => ({ mt: 2.5, mb: 1, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: lobbyOf(theme).ink })}>
        Games
      </Typography>
      <RecentlyPlayed />
      <GameBanners />
      {/* stays at the foot of a tall screen, under the games rather than straight after them */}
      <Box sx={{ flex: 1, display: "flex", alignItems: "flex-end", pt: 3 }}>
        <AskForGame />
      </Box>
    </Stack>
  </Box>
);

export default Play;
