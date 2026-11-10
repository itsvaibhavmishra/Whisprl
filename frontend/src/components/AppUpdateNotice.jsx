import { useEffect, useRef } from "react";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowClockwiseIcon, ArrowUpIcon, DownloadSimpleIcon, ExclamationMarkIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";

import WhisprlMark from "@/assets/icons/logo/WhisprlMark.webp";
import useIsLoading from "@/hooks/useIsLoading";
import { FinishAppUpdate, StartAppUpdate } from "@/redux/slices/actions/appUpdateActions";
import { DOWNLOADING, dismissAppUpdate } from "@/redux/slices/appUpdateSlice";
import { PLAY_LISTING } from "@/utils/playUpdate";

// the green of Play's own Install and Update buttons, so the action reads as Play's before its label does
const PLAY_GREEN = "#01875F";
const PLAY_GLOW = `0 6px 14px ${alpha(PLAY_GREEN, 0.3)}`;
const ROOM = "--update-notice-room";
const GAP = 16;

const percentOf = ({ downloaded, total }) => (total > 0 ? Math.round((downloaded / total) * 100) : null);

// tells the page how much room the card takes on a phone, where it sits in the page's column above the tab bar
const useRoomTaken = () => {
  const card = useRef(null);
  useEffect(() => {
    const root = document.documentElement.style;
    const observer = new ResizeObserver(([entry]) => {
      const isInColumn = getComputedStyle(entry.target).position !== "fixed";
      root.setProperty(ROOM, isInColumn ? `${entry.target.offsetHeight + GAP}px` : "0px");
    });
    observer.observe(card.current);
    return () => {
      observer.disconnect();
      root.removeProperty(ROOM);
    };
  }, []);
  return card;
};

// the home screen icon, mascot on white, with what is happening to it in the corner, the way Play lists an app with an update waiting
const AppMark = ({ Badge, badgeColour, badgeInk = "common.white" }) => (
  <Box sx={{ position: "relative", flexShrink: 0, width: 48, height: 48 }}>
    <Box
      component="img"
      src={WhisprlMark}
      alt=""
      sx={{ width: 48, height: 48, p: "4px", display: "block", borderRadius: "14px", bgcolor: "common.white", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.18)" }}
    />
    <Box
      sx={(theme) => ({
        position: "absolute",
        right: -5,
        bottom: -5,
        width: 22,
        height: 22,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        color: badgeInk,
        bgcolor: badgeColour,
        boxShadow: `0 0 0 3px ${theme.palette.chat.raised}`,
      })}
    >
      <Badge size={13} weight="bold" aria-hidden />
    </Box>
  </Box>
);

const PlayButton = (props) => (
  <Button
    variant="contained"
    size="small"
    {...props}
    sx={{
      px: 2.25,
      borderRadius: 99,
      fontWeight: 700,
      color: "common.white",
      bgcolor: PLAY_GREEN,
      boxShadow: PLAY_GLOW,
      "&:hover": { bgcolor: "#016E4D", boxShadow: PLAY_GLOW },
      "&.Mui-focusVisible": { outline: 2, outlineColor: PLAY_GREEN, outlineOffset: 2 },
    }}
  />
);

// on a phone it takes its room from the page rather than covering the last rows, and on a wider screen it floats in the corner
const Card = ({ isUrgent, mark, title, text, children }) => {
  const card = useRoomTaken();
  return (
    <Box
      ref={card}
      role="status"
      sx={(theme) => ({
        flexShrink: 0,
        position: { md: "fixed" },
        zIndex: { md: theme.zIndex.appBar },
        right: { md: 24 },
        bottom: { md: 24 },
        width: { md: 400 },
        mx: { xs: 2, md: 0 },
        mb: { xs: `${GAP}px`, md: 0 },
        p: 2,
        borderRadius: 3,
        bgcolor: theme.palette.chat.raised,
        boxShadow: theme.customShadows.dropdown,
        outline: isUrgent ? `1px solid ${alpha(theme.palette.warning.main, 0.55)}` : "none",
      })}
    >
      <Stack direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
        {mark}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, lineHeight: 1.35 }}>{title}</Typography>
          {text && <Typography sx={{ mt: 0.25, fontSize: 13.5, lineHeight: 1.4, color: "text.secondary" }}>{text}</Typography>}
        </Box>
      </Stack>
      {children}
    </Box>
  );
};

const Actions = ({ children }) => (
  <Stack direction="row" spacing={1} sx={{ mt: 1.75, justifyContent: "flex-end", alignItems: "center" }}>
    {children}
  </Stack>
);

const textFor = ({ level, via, flow }) => {
  if (level === "required") return "This version is too old to keep working properly.";
  if (via === "listing") return "Get it from Whisprl's page on Google Play.";
  return flow === "flexible" ? "Google Play downloads it while you keep chatting." : "Google Play installs it in a moment.";
};

const UpdateButton = ({ notice }) => {
  const dispatch = useDispatch();
  const isStarting = useIsLoading(StartAppUpdate);

  // the Play Store app opens its own listing, so nothing is ever downloaded from outside Play
  if (notice.via === "listing") {
    return (
      <PlayButton component="a" href={PLAY_LISTING} target="_blank" rel="noopener">
        Update on Google Play
      </PlayButton>
    );
  }
  return (
    <PlayButton loading={isStarting} onClick={() => dispatch(StartAppUpdate(notice.flow))}>
      Update
    </PlayButton>
  );
};

const AppUpdateNotice = () => {
  const dispatch = useDispatch();
  const { notice, download, isDismissed } = useSelector((state) => state.appUpdate);
  const isFinishing = useIsLoading(FinishAppUpdate);

  if (download?.status === "downloaded") {
    return (
      <Card
        mark={<AppMark Badge={ArrowClockwiseIcon} badgeColour={PLAY_GREEN} />}
        title="The update is ready"
        text="Restart Whisprl to finish. It takes a few seconds."
      >
        <Actions>
          <PlayButton loading={isFinishing} onClick={() => dispatch(FinishAppUpdate())}>
            Restart
          </PlayButton>
        </Actions>
      </Card>
    );
  }

  if (DOWNLOADING.includes(download?.status)) {
    const percent = percentOf(download);
    return (
      <Card
        mark={<AppMark Badge={DownloadSimpleIcon} badgeColour={PLAY_GREEN} />}
        title="Downloading the update"
        text="Keep chatting, Google Play does the rest."
      >
        <Stack direction="row" spacing={1.5} sx={{ mt: 1.75, alignItems: "center" }}>
          <LinearProgress
            aria-label="Download progress"
            variant={percent === null ? "indeterminate" : "determinate"}
            value={percent ?? 0}
            sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: alpha(PLAY_GREEN, 0.2), "& .MuiLinearProgress-bar": { borderRadius: 3, bgcolor: PLAY_GREEN } }}
          />
          {percent !== null && (
            <Typography sx={{ minWidth: 36, textAlign: "right", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{percent}%</Typography>
          )}
        </Stack>
      </Card>
    );
  }

  if (!notice || (notice.level === "recommended" && isDismissed)) return null;
  const isRequired = notice.level === "required";

  return (
    <Card
      isUrgent={isRequired}
      mark={
        <AppMark
          Badge={isRequired ? ExclamationMarkIcon : ArrowUpIcon}
          badgeColour={isRequired ? "warning.main" : PLAY_GREEN}
          badgeInk={isRequired ? "warning.contrastText" : "common.white"}
        />
      }
      title={isRequired ? "Update Whisprl" : "A new version of Whisprl is ready"}
      text={textFor(notice)}
    >
      <Actions>
        {!isRequired && (
          <Button size="small" color="inherit" onClick={() => dispatch(dismissAppUpdate())} sx={{ color: "text.secondary", fontWeight: 700 }}>
            Not now
          </Button>
        )}
        <UpdateButton notice={notice} />
      </Actions>
    </Card>
  );
};

export default AppUpdateNotice;
