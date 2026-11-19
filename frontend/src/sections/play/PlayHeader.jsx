import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

import gift from "@/assets/play/gift.svg";
import useInviteFriends from "@/hooks/useInviteFriends";
import { PATH_DASHBOARD } from "@/routes/paths";
import { lobbyOf } from "@/sections/play/lobby";
import { PREVIEW } from "@/sections/play/preview";
import getAvatar from "@/utils/avatars";

const PlayHeader = () => {
  const { avatar, name } = useSelector((state) => state.user.user);
  const invite = useInviteFriends();
  const { level, xp } = PREVIEW;

  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
      <ButtonBase component={Link} to={PATH_DASHBOARD.general.settings} aria-label="You" sx={{ borderRadius: "50%", flexShrink: 0 }}>
        {getAvatar(avatar, name, 44)}
      </ButtonBase>
      <Stack spacing={0.25}>
        <Typography sx={(theme) => ({ fontFamily: "Fredoka, Manrope, sans-serif", fontSize: 18, fontWeight: 700, lineHeight: 1, color: lobbyOf(theme).ink })}>
          {xp.toLocaleString()}{" "}
          <Box component="span" sx={{ fontSize: 13, color: "#F59E0B" }}>
            XP
          </Box>
        </Typography>
        <Typography sx={(theme) => ({ fontSize: 12, fontWeight: 800, lineHeight: 1, letterSpacing: "0.02em", color: lobbyOf(theme).muted })}>
          Lv. {level}
        </Typography>
      </Stack>
      <ButtonBase
        onClick={invite}
        disabled={!invite}
        sx={(theme) => ({
          ml: "auto",
          flexDirection: "column",
          gap: 0.25,
          px: 0.5,
          borderRadius: 2,
          fontSize: 11,
          fontWeight: 600,
          color: lobbyOf(theme).muted,
        })}
      >
        <Box component="img" src={gift} alt="" sx={{ width: 24, height: 24 }} />
        Invite
      </ButtonBase>
    </Stack>
  );
};

export default PlayHeader;
