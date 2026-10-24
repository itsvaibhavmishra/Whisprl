import { useCallback, useEffect, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { GetReports } from "@/redux/slices/actions/adminActions";
import Notice from "@/sections/admin/Notice";
import PillGroup from "@/sections/admin/PillGroup";
import ReportCard from "@/sections/admin/ReportCard";

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "actioned", label: "Actioned" },
  { value: "dismissed", label: "Dismissed" },
];

const PAGE_SIZE = 20;

const EMPTY = {
  open: { title: "Nothing waiting", body: "Reports people send about a person, a chat, a group or an update arrive here." },
  actioned: { title: "Nothing actioned yet", body: "Reports you act on by suspending or banning someone are listed here." },
  dismissed: { title: "Nothing dismissed yet", body: "Reports you decide need no action are listed here." },
};

const Reports = () => {
  const dispatch = useDispatch();
  const { list, total, hasMore } = useSelector((state) => state.admin.reports);
  const isLoading = useIsLoading(GetReports);
  const [filter, setFilter] = useState("open");
  const [hasFailed, setHasFailed] = useState(false);

  const read = useCallback(
    (page) => dispatch(GetReports({ filter, page })).then((result) => setHasFailed(GetReports.rejected.match(result))),
    [dispatch, filter]
  );

  useEffect(() => {
    read();
  }, [read]);

  const body = () => {
    if (!list && hasFailed) {
      return (
        <Box>
          <Notice title="The reports didn't load">Check your connection and try again.</Notice>
          <Button variant="contained" loading={isLoading} onClick={() => read()} sx={{ mt: 2 }}>
            Try again
          </Button>
        </Box>
      );
    }
    if (!list) return <CircularProgress size={28} aria-label="Loading the reports" sx={{ mt: 5 }} />;
    if (!list.length) return <Notice title={EMPTY[filter].title}>{EMPTY[filter].body}</Notice>;

    return (
      <>
        <Typography sx={{ mt: 3, fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
          {total === 1 ? "1 report" : `${total.toLocaleString()} reports`}
        </Typography>
        <Box component="ul" sx={{ m: 0, mt: 1, p: 0, listStyle: "none", opacity: isLoading ? 0.5 : 1, transition: "opacity 160ms ease" }}>
          {list.map((report) => (
            <ReportCard key={report._id} report={report} onChanged={() => read()} />
          ))}
        </Box>
        {hasMore && (
          <Button variant="outlined" color="inherit" loading={isLoading} onClick={() => read(Math.ceil(list.length / PAGE_SIZE))} sx={{ mt: 2 }}>
            Show more
          </Button>
        )}
      </>
    );
  };

  return (
    <Stack sx={{ maxWidth: 760, px: { xs: 2, md: 6 }, py: { xs: 3, md: 6 } }}>
      <Typography component="h1" sx={{ m: 0, fontSize: { xs: 26, md: 32 }, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Reports
      </Typography>
      <Typography sx={{ mt: 1, maxWidth: 600, fontSize: 15, color: "text.secondary", textWrap: "balance" }}>
        What people have reported. Whisprl cannot read messages, so a report carries only what the reporter chose to send, and each one is checked against what
        was really sent.
      </Typography>

      <Box sx={{ mt: 4 }}>
        <PillGroup label="Show" options={FILTERS} value={filter} onChange={setFilter} />
      </Box>

      {body()}
    </Stack>
  );
};

export default Reports;
