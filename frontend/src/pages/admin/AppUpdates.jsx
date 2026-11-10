import { useCallback, useEffect, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { GetAppUpdates } from "@/redux/slices/actions/adminActions";
import Notice from "@/sections/admin/Notice";
import UpdatePolicyForm from "@/sections/admin/UpdatePolicyForm";

const AppUpdates = () => {
  const dispatch = useDispatch();
  const policy = useSelector((state) => state.admin.appUpdates);
  const isLoading = useIsLoading(GetAppUpdates);
  const [hasFailed, setHasFailed] = useState(false);

  const read = useCallback(() => dispatch(GetAppUpdates()).then((result) => setHasFailed(GetAppUpdates.rejected.match(result))), [dispatch]);

  useEffect(() => {
    read();
  }, [read]);

  const body = () => {
    if (!policy && hasFailed) {
      return (
        <Box>
          <Notice title="The settings didn't load">Check your connection and try again.</Notice>
          <Button variant="contained" loading={isLoading} onClick={read} sx={{ mt: 2 }}>
            Try again
          </Button>
        </Box>
      );
    }
    if (!policy) return <CircularProgress size={28} aria-label="Loading the settings" sx={{ mt: 4 }} />;
    return <UpdatePolicyForm policy={policy} />;
  };

  return (
    <Stack sx={{ maxWidth: 960, px: { xs: 2, md: 6 }, py: { xs: 3, md: 6 } }}>
      <Typography component="h1" sx={{ m: 0, fontSize: { xs: 26, md: 32 }, fontWeight: 800, letterSpacing: "-0.02em" }}>
        App updates
      </Typography>
      <Typography sx={{ mt: 1, maxWidth: 600, fontSize: 15, color: "text.secondary", textWrap: "balance" }}>
        Whether the Android app reminds people to update from Google Play. Which version it asks for comes with the app itself, and apps check when they open.
      </Typography>
      {body()}
    </Stack>
  );
};

export default AppUpdates;
