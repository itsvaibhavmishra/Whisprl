import { Box, ButtonBase, Stack, Typography } from "@mui/material";

import friends from "@/assets/play/friends.svg";
import tasks from "@/assets/play/tasks.svg";
import trophy from "@/assets/play/trophy.svg";
import { lobbyOf } from "@/sections/play/lobby";
import { PREVIEW } from "@/sections/play/preview";
import RingFrame from "@/sections/play/RingFrame";

const SHORTCUTS = [
  {
    label: "Ranking",
    art: trophy,
    from: "#FF6A8D",
    to: "#E0356B",
  },
  {
    label: "Tasks",
    art: tasks,
    from: "#A6E15A",
    to: "#3DAE4C",
    hasDot: PREVIEW.hasNewTasks,
  },
  {
    label: "Friends",
    art: friends,
    from: "#FFC247",
    to: "#FF7A2E",
  },
];

const Badge = ({ art, from, to, hasDot }) => (
  <Box sx={{ position: "relative" }}>
    <RingFrame from={from} to={to} size={{ xs: 52, sm: 58 }}>
      <Box component="img" src={art} alt="" sx={{ width: "70%", filter: "drop-shadow(0 2px 2px rgba(20, 30, 80, 0.2))" }} />
    </RingFrame>
    {hasDot && (
      <Box sx={{ position: "absolute", top: "6%", right: "6%", width: 11, height: 11, borderRadius: "50%", bgcolor: "#FF4D5E", border: "2px solid #fff" }} />
    )}
  </Box>
);

const ShortcutBadges = () => (
  <Stack direction="row" sx={{ justifyContent: { xs: "space-around", md: "center" }, gap: { md: 8 } }}>
    {SHORTCUTS.map(({ label, ...look }) => (
      <ButtonBase
        key={label}
        aria-label={look.hasDot ? `${label}, new` : label}
        sx={{ flexDirection: "column", gap: 0.75, borderRadius: 3, px: 1, py: 0.5, "&:active > :first-of-type": { transform: "scale(0.94)" } }}
      >
        <Badge {...look} />
        <Typography sx={(theme) => ({ fontSize: 12.5, fontWeight: 600, color: lobbyOf(theme).ink })}>{label}</Typography>
      </ButtonBase>
    ))}
  </Stack>
);

export default ShortcutBadges;
