import { Box, Button, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";

import PlatformIcons from "@/sections/admin/PlatformIcons";
import getAvatar from "@/utils/avatars";

const activityOf = ({ activeDays, lastDay }) => `${activeDays} ${activeDays === 1 ? "day" : "days"}, last on ${dayjs(lastDay).format("D MMM")}`;

const ActivePeople = ({ people, hasMore, isLoading, onMore }) => {
  if (!people) return null;
  if (!people.length) return <Typography sx={{ mt: 2, fontSize: 14, color: "text.secondary" }}>Nobody opened Whisprl in these days.</Typography>;

  return (
    <>
      <Box component="ul" sx={{ m: 0, mt: 1, p: 0, listStyle: "none" }}>
        {people.map((person) => (
          <Stack key={person._id} component="li" direction="row" spacing={1.5} sx={{ alignItems: "center", py: 1.25, borderTop: 1, borderColor: "divider" }}>
            {getAvatar(person.avatar, `${person.firstName} ${person.lastName}`, 36)}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 700 }}>{`${person.firstName} ${person.lastName}`}</Typography>
              <Typography noWrap sx={{ fontSize: 12.5, color: "text.secondary" }}>
                {person.username ? `@${person.username} · ${activityOf(person)}` : activityOf(person)}
              </Typography>
            </Box>
            <PlatformIcons platforms={person.platforms} />
          </Stack>
        ))}
      </Box>
      {hasMore && (
        <Button variant="outlined" color="inherit" loading={isLoading} onClick={onMore} sx={{ mt: 1.5 }}>
          Show more
        </Button>
      )}
    </>
  );
};

export default ActivePeople;
