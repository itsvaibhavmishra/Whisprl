import { Box, Stack, Typography } from "@mui/material";

import BadgeGrid from "@/sections/badges/BadgeGrid";
import { PaneEmpty } from "@/components/Pane";
import BadgeHero from "@/sections/badges/BadgeHero";
import { badgeCountOf, badgesByYearAndMonth } from "@/utils/badges";
import { firstWordOf } from "@/utils/names";

const Month = ({ month, pagesThrough, personId, canShare }) => (
  <Box component="li" sx={{ position: "relative", pl: 3, pb: 2 }}>
    <Box aria-hidden sx={{ position: "absolute", left: -5, top: 7, width: 10, height: 10, borderRadius: "50%", bgcolor: "primary.main" }} />
    <Typography component="h4" sx={{ fontSize: 15, fontWeight: 700, color: "text.secondary" }}>
      {month.label}
    </Typography>
    <Box sx={{ mt: 1 }}>
      <BadgeGrid badges={month.badges} pagesThrough={pagesThrough} personId={personId} canShare={canShare} withDates />
    </Box>
  </Box>
);

const BadgeProgress = ({ person, isOwn }) => {
  const years = badgesByYearAndMonth(person.badges ?? []);
  const inTimelineOrder = years.flatMap((year) => year.months.flatMap((month) => month.badges));

  return (
    <Stack spacing={4}>
      <BadgeHero person={person} />
      {years.length === 0 ? (
        <PaneEmpty text={`${firstWordOf(person.name)} has no badges yet.`} />
      ) : (
        years.map(({ year, count, months }) => (
          <Box component="section" key={year} aria-label={`${year}, ${badgeCountOf(count)}`}>
            <Typography component="h3" sx={{ fontSize: 20, fontWeight: 800 }}>
              {year}
              <Box component="span" sx={{ ml: 1, fontWeight: 600, color: "text.secondary" }}>
                {badgeCountOf(count)}
              </Box>
            </Typography>
            <Box component="ol" sx={{ m: 0, mt: 2, ml: 1, p: 0, listStyle: "none", borderLeft: 2, borderColor: "divider" }}>
              {months.map((month) => (
                <Month key={month.key} month={month} pagesThrough={inTimelineOrder} personId={person._id} canShare={isOwn} />
              ))}
            </Box>
          </Box>
        ))
      )}
    </Stack>
  );
};

export default BadgeProgress;
