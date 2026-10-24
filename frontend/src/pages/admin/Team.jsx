import { useCallback, useEffect, useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { PlusIcon } from "@phosphor-icons/react";
import { useDispatch, useSelector } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { GetTeam } from "@/redux/slices/actions/adminActions";
import AccessDialog from "@/sections/admin/AccessDialog";
import Notice from "@/sections/admin/Notice";
import TeamMember from "@/sections/admin/TeamMember";

const Team = () => {
  const dispatch = useDispatch();
  const members = useSelector((state) => state.admin.team);
  const isLoading = useIsLoading(GetTeam);
  const [hasFailed, setHasFailed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const read = useCallback(() => dispatch(GetTeam()).then((result) => setHasFailed(GetTeam.rejected.match(result))), [dispatch]);

  useEffect(() => {
    read();
  }, [read]);

  const body = () => {
    if (!members && hasFailed) {
      return (
        <Box>
          <Notice title="The team didn't load">Check your connection and try again.</Notice>
          <Button variant="contained" loading={isLoading} onClick={read} sx={{ mt: 2 }}>
            Try again
          </Button>
        </Box>
      );
    }
    if (!members) return <CircularProgress size={28} aria-label="Loading the team" sx={{ mt: 5 }} />;

    return (
      <>
        <Box component="ul" sx={{ m: 0, mt: 3, p: 0, listStyle: "none" }}>
          {members.map((member) => (
            <TeamMember key={member._id} member={member} onChanged={read} />
          ))}
        </Box>
        {members.every(({ role }) => role === "owner") && (
          <Notice title="No admins yet">Add someone to share the work. You choose what each of them can do, and can change it any time.</Notice>
        )}
      </>
    );
  };

  return (
    <Stack sx={{ maxWidth: 760, px: { xs: 2, md: 6 }, py: { xs: 3, md: 6 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "flex-end" }, justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" sx={{ m: 0, fontSize: { xs: 26, md: 32 }, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Team
          </Typography>
          <Typography sx={{ mt: 1, maxWidth: 480, fontSize: 15, color: "text.secondary", textWrap: "balance" }}>
            Who can open this panel, and what each of them can do there. Only you can change it.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PlusIcon weight="bold" />}
          onClick={() => setIsAdding(true)}
          sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "auto" } }}
        >
          Add an admin
        </Button>
      </Stack>

      {body()}

      {isAdding && <AccessDialog onClose={() => setIsAdding(false)} onDone={read} />}
    </Stack>
  );
};

export default Team;
