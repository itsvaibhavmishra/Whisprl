import { useCallback, useEffect, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { GetAnnouncements, GetAudienceSizes } from "@/redux/slices/actions/adminActions";
import AnnouncementForm from "@/sections/admin/AnnouncementForm";
import Notice from "@/sections/admin/Notice";
import SentAnnouncement from "@/sections/admin/SentAnnouncement";

const PROGRESS_EVERY_MS = 3000;

const Announcements = () => {
  const dispatch = useDispatch();
  const { list, hasMore } = useSelector((state) => state.admin.announcements);
  const sizes = useSelector((state) => state.admin.audienceSizes);
  const isLoading = useIsLoading(GetAnnouncements);
  const [hasFailed, setHasFailed] = useState(false);
  const isSending = Boolean(list?.some((announcement) => !announcement.finishedAt));

  const refresh = useCallback(() => {
    dispatch(GetAnnouncements()).then((result) => setHasFailed(GetAnnouncements.rejected.match(result)));
    dispatch(GetAudienceSizes());
  }, [dispatch]);

  useEffect(refresh, [refresh]);

  // while one is still going out, its count keeps up without a reload
  useEffect(() => {
    if (!isSending) return undefined;
    const timer = setInterval(() => dispatch(GetAnnouncements()), PROGRESS_EVERY_MS);
    return () => clearInterval(timer);
  }, [dispatch, isSending]);

  const sent = () => {
    if (!list && hasFailed) {
      return (
        <Box>
          <Notice title="What was sent didn't load">Check your connection and try again.</Notice>
          <Button variant="contained" loading={isLoading} onClick={refresh} sx={{ mt: 2 }}>
            Try again
          </Button>
        </Box>
      );
    }
    if (!list) return <CircularProgress size={28} aria-label="Loading what was sent" sx={{ mt: 3 }} />;
    if (!list.length) return <Notice title="Nothing sent yet">Announcements you send are listed here, with how many people each one reached.</Notice>;
    return (
      <>
        <Box component="ol" sx={{ m: 0, mt: 1, p: 0, listStyle: "none", borderTop: 1, borderColor: "divider" }}>
          {list.map((announcement) => (
            <SentAnnouncement key={announcement._id} announcement={announcement} />
          ))}
        </Box>
        {hasMore && (
          <Button
            variant="outlined"
            color="inherit"
            loading={isLoading}
            onClick={() => dispatch(GetAnnouncements(list.at(-1)._id))}
            sx={{ mt: 2, alignSelf: "flex-start" }}
          >
            Show more
          </Button>
        )}
      </>
    );
  };

  return (
    <Stack sx={{ maxWidth: 960, px: { xs: 2, md: 6 }, py: { xs: 3, md: 6 } }}>
      <Typography component="h1" sx={{ m: 0, fontSize: { xs: 26, md: 32 }, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Announcements
      </Typography>
      <Typography sx={{ mt: 1, maxWidth: 600, fontSize: 15, color: "text.secondary", textWrap: "balance" }}>
        A message from Whisprl, in everyone's chat with it. Anyone who has muted that chat gets it without a notification.
      </Typography>

      <AnnouncementForm sizes={sizes} onSent={refresh} />

      <Typography component="h2" sx={{ m: 0, mt: 6, fontSize: 20, fontWeight: 800 }}>
        Sent
      </Typography>
      {sent()}
    </Stack>
  );
};

export default Announcements;
