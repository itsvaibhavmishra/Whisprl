import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useDispatch, useSelector } from "react-redux";

import UsernameDialog from "@/components/UsernameDialog";
import useIsLoading from "@/hooks/useIsLoading";
import { ConfirmUsername, GetOnboarding } from "@/redux/slices/actions/onboardingActions";
import { profileLinkOf } from "@/sections/contacts/contactsRoute";

const UsernameStep = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const isKeeping = useIsLoading(ConfirmUsername);
  const [isChanging, setIsChanging] = useState(false);

  // a saved change finishes the step on the server, so closing the dialog either way checks progress again
  const closeDialog = () => {
    setIsChanging(false);
    dispatch(GetOnboarding());
  };

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography component="h2" sx={{ m: 0, fontSize: 20, fontWeight: 700 }}>
          Your username
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          People find you by it, and it&apos;s in the link to your profile. Changing it now means waiting 30 days before the next change.
        </Typography>
      </Stack>
      <Box sx={{ px: 2, py: 1.75, borderRadius: 2, bgcolor: "action.hover", minWidth: 0 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, overflowWrap: "anywhere" }}>@{user.username}</Typography>
        <Typography noWrap variant="body2" sx={{ mt: 0.25, color: "text.secondary" }}>
          {profileLinkOf(user).replace(/^https?:\/\//, "")}
        </Typography>
      </Box>
      <Stack spacing={1}>
        <LoadingButton size="large" variant="contained" fullWidth loading={isKeeping} onClick={() => dispatch(ConfirmUsername())}>
          Keep @{user.username}
        </LoadingButton>
        <Button size="large" variant="outlined" color="inherit" fullWidth onClick={() => setIsChanging(true)}>
          Change it
        </Button>
      </Stack>
      {isChanging && <UsernameDialog current={user.username} onClose={closeDialog} />}
    </Stack>
  );
};

export default UsernameStep;
