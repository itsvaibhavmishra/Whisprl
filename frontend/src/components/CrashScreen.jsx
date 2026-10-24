import { useEffect, useState } from "react";
import { Button, Stack, Typography } from "@mui/material";

import LoadingScreen from "@/components/LoadingScreen";
import MascotHalo from "@/components/MascotHalo";
import Wordmark from "@/components/Wordmark";
import { canReloadForNewVersion, isMissingCode, reloadForNewVersion } from "@/utils/newVersion";

const CrashScreen = ({ error }) => {
  const [isNewVersion] = useState(() => isMissingCode(error?.name, error?.message) && canReloadForNewVersion());

  useEffect(() => {
    if (isNewVersion) reloadForNewVersion();
  }, [isNewVersion]);

  if (isNewVersion) return <LoadingScreen />;
  return <Crashed />;
};

// a full reload rather than a route change, since whatever broke may still be in memory
const Crashed = () => (
  <Stack sx={{ alignItems: "center", justifyContent: "center", minHeight: "100dvh", px: 3, textAlign: "center", bgcolor: "background.default" }}>
    <MascotHalo />
    <Typography component="h1" sx={{ m: 0, mt: 1 }}>
      <Wordmark name="Oops" fontSize={{ xs: "2.75rem", md: "3.5rem" }} />
    </Typography>
    <Typography sx={{ mt: 1.5, maxWidth: 380, fontSize: 16, fontWeight: 500, color: "text.secondary" }}>
      Whisprl ran into a problem. Reloading usually fixes it, and your messages are safe.
    </Typography>
    <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 3 }}>
      Reload Whisprl
    </Button>
  </Stack>
);

export default CrashScreen;
