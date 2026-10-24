import { useCallback, useEffect, useState } from "react";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { GetAuditLog } from "@/redux/slices/actions/adminActions";
import AuditTimeline from "@/sections/admin/AuditTimeline";
import Notice from "@/sections/admin/Notice";

const AuditLog = () => {
  const dispatch = useDispatch();
  const { entries, hasMore } = useSelector((state) => state.admin.audit);
  const isLoading = useIsLoading(GetAuditLog);
  const [hasFailed, setHasFailed] = useState(false);

  const read = useCallback((before) => dispatch(GetAuditLog(before)).then((result) => setHasFailed(GetAuditLog.rejected.match(result))), [dispatch]);

  useEffect(() => {
    read();
  }, [read]);

  const body = () => {
    if (!entries && hasFailed) {
      return (
        <Box>
          <Notice title="The log didn't load">Check your connection and try again.</Notice>
          <LoadingButton variant="contained" loading={isLoading} onClick={() => read()} sx={{ mt: 2 }}>
            Try again
          </LoadingButton>
        </Box>
      );
    }
    if (!entries) return <CircularProgress size={28} aria-label="Loading the audit log" sx={{ mt: 5 }} />;
    if (!entries.length) {
      return <Notice title="Nothing recorded yet">When someone on the team takes an action from here, it's listed with who took it and why.</Notice>;
    }
    return (
      <>
        <AuditTimeline entries={entries} />
        {hasMore && (
          <LoadingButton variant="outlined" color="inherit" loading={isLoading} onClick={() => read(entries.at(-1)._id)} sx={{ mt: 2, ml: 6 }}>
            Show older entries
          </LoadingButton>
        )}
      </>
    );
  };

  return (
    <Stack sx={{ maxWidth: 760, px: { xs: 2, md: 6 }, py: { xs: 3, md: 6 } }}>
      <Typography component="h1" sx={{ m: 0, fontSize: { xs: 26, md: 32 }, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Audit log
      </Typography>
      <Typography sx={{ mt: 1, maxWidth: 560, fontSize: 15, color: "text.secondary", textWrap: "balance" }}>
        Every action taken from this panel, who took it and why. Entries can't be changed or removed.
      </Typography>
      {body()}
    </Stack>
  );
};

export default AuditLog;
