import { useEffect, useState } from "react";
import { Box, Button, ButtonBase, CircularProgress, Collapse, Stack, Typography } from "@mui/material";
import { CaretDownIcon } from "@phosphor-icons/react";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { GetStoppedPeople } from "@/redux/slices/actions/adminActions";
import getAvatar from "@/utils/avatars";

// the server's page size, so the next page starts where this list ends
const PEOPLE_PER_PAGE = 20;

const STAGE_LABELS = {
  verified: "Verified their email",
  birthday: "Added their birthday",
  username: "Chose a username",
  recoveryKey: "Saved their recovery key",
  firstFriend: "Made a first friend",
  firstMessage: "Sent a first message",
};

const VIA_LABELS = { email: "email", google: "Google", github: "GitHub", linkedin: "LinkedIn" };

const shareOf = (count, started) => `${Math.round((count / started) * 100)}%`;

const StageBar = ({ label, reached, started }) => (
  <>
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline", justifyContent: "space-between" }}>
      <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography sx={{ flexShrink: 0, fontSize: 13, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
        {`${reached.toLocaleString()} · ${shareOf(reached, started)}`}
      </Typography>
    </Stack>
    <Box sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}>
      <Box sx={{ width: shareOf(reached, started), height: "100%", borderRadius: 3, bgcolor: "primary.main" }} />
    </Box>
  </>
);

const StoppedPeople = ({ stage, range }) => {
  const dispatch = useDispatch();
  const { list, hasMore } = useSelector((state) => state.admin.stoppedPeople);
  const isLoading = useIsLoading(GetStoppedPeople);

  if (!list) return <CircularProgress size={22} aria-label="Loading who stopped here" sx={{ my: 1.5 }} />;

  return (
    <>
      <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
        {list.map((person) => (
          <Stack key={person._id} component="li" direction="row" spacing={1.5} sx={{ alignItems: "center", py: 1 }}>
            {getAvatar(person.avatar, `${person.firstName} ${person.lastName}`, 32)}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 700 }}>{`${person.firstName} ${person.lastName}`}</Typography>
              <Typography noWrap sx={{ fontSize: 12.5, color: "text.secondary" }}>
                {[person.username && `@${person.username}`, `joined ${dayjs(person.startedAt).format("D MMM")} with ${VIA_LABELS[person.via]}`]
                  .filter(Boolean)
                  .join(" · ")}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Box>
      {hasMore && (
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          loading={isLoading}
          onClick={() => dispatch(GetStoppedPeople({ stage, ...range, page: Math.ceil(list.length / PEOPLE_PER_PAGE) }))}
          sx={{ mt: 1, mb: 1 }}
        >
          Show more
        </Button>
      )}
    </>
  );
};

// each account counts once, at the first step it hasn't reached, so a tap shows exactly who is waiting there
const SignUpJourney = ({ journey, range }) => {
  const dispatch = useDispatch();
  const [openStage, setOpenStage] = useState(null);

  useEffect(() => {
    if (openStage) dispatch(GetStoppedPeople({ stage: openStage, ...range, page: 0 }));
  }, [dispatch, openStage, range]);

  if (!journey.started) {
    return <Typography sx={{ mt: 2, fontSize: 14, color: "text.secondary" }}>Nobody made an account in these days since tracking began.</Typography>;
  }

  return (
    <Box component="ol" sx={{ m: 0, mt: 1, p: 0, listStyle: "none" }}>
      <Box component="li" sx={{ py: 1.5, borderTop: 1, borderColor: "divider" }}>
        <StageBar label="Made an account" reached={journey.started} started={journey.started} />
      </Box>
      {journey.stages.map(({ stage, reached, stopped }) => {
        const isOpen = openStage === stage;
        return (
          <Box key={stage} component="li" sx={{ py: 1.5, borderTop: 1, borderColor: "divider" }}>
            <StageBar label={STAGE_LABELS[stage]} reached={reached} started={journey.started} />
            {stopped > 0 && (
              <ButtonBase
                aria-expanded={isOpen}
                onClick={() => setOpenStage(isOpen ? null : stage)}
                sx={{ mt: 0.75, gap: 0.5, px: 0.75, mx: -0.75, borderRadius: 1, fontSize: 13, fontWeight: 600, color: "warning.main" }}
              >
                {`${stopped.toLocaleString()} stopped before this`}
                <CaretDownIcon size={12} weight="bold" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms ease" }} />
              </ButtonBase>
            )}
            <Collapse in={isOpen} unmountOnExit>
              <StoppedPeople stage={stage} range={range} />
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
};

export default SignUpJourney;
