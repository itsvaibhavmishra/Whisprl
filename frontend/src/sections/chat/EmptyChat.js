import { Box, ButtonBase, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AddressBook, CircleDashed, LockSimple, UsersThree } from "phosphor-react";
import { Link } from "react-router-dom";

import MascotHalo from "@/components/MascotHalo";
import Wordmark from "@/components/Wordmark";
import { PATH_DASHBOARD } from "@/routes/paths";
import ChatCanvas from "@/sections/chat/ChatCanvas";
import { MAX_GROUP_SIZE } from "@/utils/groups";
import { gradientOf } from "@/utils/gradients";

const ActionTile = ({ icon: Icon, label, detail, background, ...button }) => (
  <ButtonBase
    {...button}
    sx={{
      flex: "1 1 0",
      minWidth: 150,
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 1.25,
      p: 2,
      borderRadius: 4,
      textAlign: "left",
      bgcolor: "chat.pill",
      boxShadow: (theme) => `0 0 0 1px ${theme.palette.divider}`,
      transition: "transform 180ms ease, box-shadow 180ms ease",
      "&:hover": { transform: "translateY(-2px)", boxShadow: (theme) => `0 10px 28px -12px ${theme.palette.chat.shade}, 0 0 0 1px ${alpha(theme.palette.primary.main, 0.4)}` },
    }}
  >
    <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", background }}>
      <Icon size={20} weight="fill" />
    </Box>
    <Box>
      <Typography sx={{ fontSize: 15, fontWeight: 800 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "text.secondary" }}>{detail}</Typography>
    </Box>
  </ButtonBase>
);

const EmptyChat = ({ onNewGroup }) => (
  <ChatCanvas sx={{ height: "100%", display: "grid", placeItems: "center", px: 3, overflowY: "auto" }}>
    <Stack
      alignItems="center"
      sx={{
        width: "100%",
        maxWidth: 560,
        py: 4,
        textAlign: "center",
        // at night the doodles are bright enough to run through the words, so a soft pool of plain canvas sits behind them
        background: (theme) =>
          theme.palette.mode === "dark" ? `radial-gradient(closest-side, ${theme.palette.chat.canvas} 55%, ${alpha(theme.palette.chat.canvas, 0)})` : "none",
      }}
    >
      <MascotHalo />
      <Typography component="h2" sx={{ mt: 1 }}>
        <Wordmark name="Whisprl" fontSize={{ xs: "2.75rem", md: "3.5rem" }} />
      </Typography>
      <Typography sx={{ mt: 1.5, fontSize: 16, fontWeight: 500, color: "text.secondary", maxWidth: 380 }}>
        Pick a chat to carry on, or start something new.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4, width: "100%" }}>
        <ActionTile icon={UsersThree} label="Start a group" detail={`Up to ${MAX_GROUP_SIZE} people`} background={gradientOf(["#7444E0", "#C2399E"])} onClick={onNewGroup} />
        <ActionTile icon={AddressBook} label="Find friends" detail="By name or username" background={gradientOf(["#0979C2", "#3E5BDB"])} component={Link} to={PATH_DASHBOARD.general.contacts} />
        <ActionTile icon={CircleDashed} label="Share a status" detail="Gone in 24 hours" background={gradientOf(["#0B7F75", "#1F8FA8"])} component={Link} to={PATH_DASHBOARD.general.status} />
      </Stack>

      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 4, px: 1.5, py: 0.5, borderRadius: 99, color: "text.secondary", bgcolor: "chat.pill" }}>
        <LockSimple size={14} weight="bold" aria-hidden />
        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Your messages are end-to-end encrypted</Typography>
      </Stack>
    </Stack>
  </ChatCanvas>
);

export default EmptyChat;
