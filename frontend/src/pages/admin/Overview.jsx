import { useCallback, useEffect, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { GetActivePeople, GetOverview } from "@/redux/slices/actions/adminActions";
import ActivePeople from "@/sections/admin/ActivePeople";
import DailyChart from "@/sections/admin/DailyChart";
import DateRangePicker from "@/sections/admin/DateRangePicker";
import GamePlays from "@/sections/admin/GamePlays";
import { PRESETS, lastDays, presetOf } from "@/sections/admin/dayRanges";
import Notice from "@/sections/admin/Notice";
import OverviewFigures from "@/sections/admin/OverviewFigures";
import PillGroup from "@/sections/admin/PillGroup";
import PlatformSplit from "@/sections/admin/PlatformSplit";

// the server's page size, so the next page starts where this list ends
const PEOPLE_PER_PAGE = 20;

const SectionTitle = ({ title, detail }) => (
  <Box>
    <Typography component="h3" sx={{ m: 0, fontSize: 16, fontWeight: 800 }}>
      {title}
    </Typography>
    <Typography sx={{ mt: 0.25, fontSize: 13, color: "text.secondary" }}>{detail}</Typography>
  </Box>
);

const Overview = () => {
  const dispatch = useDispatch();
  const overview = useSelector((state) => state.admin.overview);
  const activePeople = useSelector((state) => state.admin.activePeople);
  const isLoading = useIsLoading(GetOverview);
  const isLoadingPeople = useIsLoading(GetActivePeople);
  const [range, setRange] = useState(() => lastDays(30));
  const [hasFailed, setHasFailed] = useState(false);

  const read = useCallback(() => dispatch(GetOverview(range)).then((result) => setHasFailed(GetOverview.rejected.match(result))), [dispatch, range]);

  useEffect(() => {
    read();
    dispatch(GetActivePeople({ ...range, page: 0 }));
  }, [read, dispatch, range]);

  const showMorePeople = () => dispatch(GetActivePeople({ ...range, page: Math.ceil(activePeople.list.length / PEOPLE_PER_PAGE) }));

  const preset = presetOf(range);

  const body = () => {
    if (!overview && hasFailed) {
      return (
        <Box>
          <Notice title="The overview didn't load">Check your connection and try again.</Notice>
          <Button variant="contained" loading={isLoading} onClick={read} sx={{ mt: 2 }}>
            Try again
          </Button>
        </Box>
      );
    }
    if (!overview) return <CircularProgress size={28} aria-label="Loading the overview" sx={{ mt: 5 }} />;

    return (
      <>
        <OverviewFigures totals={overview.totals} active={overview.active} />

        <Stack direction="row" sx={{ alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", mt: 6, gap: 1.5 }}>
          <Box>
            <Typography component="h2" sx={{ m: 0, fontSize: 20, fontWeight: 800 }}>
              Day by day
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 13, color: "text.secondary" }}>Days run midnight to midnight UTC.</Typography>
          </Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{ alignItems: { xs: "stretch", sm: "center" }, flexWrap: "wrap", gap: 1, width: { xs: "100%", sm: "auto" } }}
          >
            <PillGroup
              label="Days shown"
              options={PRESETS.map(({ label }) => ({ value: label, label }))}
              value={preset?.label ?? null}
              onChange={(label) => setRange(PRESETS.find((each) => each.label === label).rangeOf())}
            />
            <DateRangePicker value={range} isCustom={!preset} onChange={setRange} />
          </Stack>
        </Stack>

        <Box
          sx={{
            mt: 3,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: { xs: 5, lg: 6 },
            opacity: isLoading ? 0.5 : 1,
            transition: "opacity 160ms ease",
          }}
        >
          <DailyChart
            title="Active people"
            total={overview.range.active}
            totalLabel="opened Whisprl in these days"
            emptyLabel="Nobody opened Whisprl in these days."
            data={overview.daily}
            dataKey="active"
            unit="active"
          />
          <DailyChart
            title="New people"
            total={overview.range.signups}
            totalLabel="joined in these days"
            emptyLabel="Nobody joined in these days."
            data={overview.daily}
            dataKey="signups"
            unit="joined"
            isBars
          />
        </Box>

        <Box
          sx={{
            mt: { xs: 5, lg: 6 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            gap: { xs: 5, lg: 6 },
            alignItems: "start",
            opacity: isLoading ? 0.5 : 1,
            transition: "opacity 160ms ease",
          }}
        >
          <Box component="section" sx={{ minWidth: 0 }}>
            <SectionTitle title="Who was active" detail="Where they opened Whisprl, and on how many of these days." />
            <Box sx={{ mt: 2 }}>
              <PlatformSplit counts={overview.range.platforms} />
            </Box>
            <ActivePeople people={activePeople.list} hasMore={activePeople.hasMore} isLoading={isLoadingPeople} onMore={showMorePeople} />
          </Box>
          <Box component="section" sx={{ minWidth: 0 }}>
            <SectionTitle title="Games played" detail="Games that got going in these days, bot games included." />
            <GamePlays rows={overview.range.games} />
          </Box>
        </Box>
      </>
    );
  };

  return (
    <Stack sx={{ maxWidth: 1200, px: { xs: 2, md: 6 }, py: { xs: 3, md: 6 } }}>
      <Typography component="h1" sx={{ m: 0, fontSize: { xs: 26, md: 32 }, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Overview
      </Typography>
      <Typography sx={{ mt: 1, maxWidth: 560, fontSize: 15, color: "text.secondary", textWrap: "balance" }}>
        How many people use Whisprl, and how much. Message contents stay encrypted, so only counts are shown here.
      </Typography>
      {body()}
    </Stack>
  );
};

export default Overview;
