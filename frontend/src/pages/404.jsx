import { Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";

import MascotHalo from "@/components/MascotHalo";
import Wordmark from "@/components/Wordmark";
import { PAGE_HEIGHT_WITH_TAB_BAR } from "@/layouts/dashboard/NavRail";
import { PATH_DASHBOARD } from "@/routes/paths";

const Page404 = () => (
  <Stack
    alignItems="center"
    justifyContent="center"
    sx={{ flexGrow: 1, minHeight: { xs: PAGE_HEIGHT_WITH_TAB_BAR, md: "100dvh" }, px: 3, textAlign: "center", bgcolor: "chat.list" }}
  >
    <MascotHalo />
    <Typography component="h1" sx={{ m: 0, mt: 1 }}>
      <Wordmark name="404" fontSize={{ xs: "2.75rem", md: "3.5rem" }} />
    </Typography>
    <Typography sx={{ mt: 1.5, maxWidth: 380, fontSize: 16, fontWeight: 500, color: "text.secondary" }}>
      There's nothing at this address. It may have moved, or never existed.
    </Typography>
    <Button component={Link} to={PATH_DASHBOARD.general.chat} variant="contained" sx={{ mt: 3 }}>
      Back to chats
    </Button>
  </Stack>
);

export default Page404;
