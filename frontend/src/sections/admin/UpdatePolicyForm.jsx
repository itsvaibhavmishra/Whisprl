import { useState } from "react";
import { Box, Button, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import { useDispatch } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { ChangeAppUpdates } from "@/redux/slices/actions/adminActions";

const RECOMMENDED = import.meta.env.REACT_APP_RECOMMENDED_VERSION_CODE;
const REQUIRED = import.meta.env.REACT_APP_REQUIRED_VERSION_CODE;

// the versions come with the app's code, so the page says which ones a reminder would name
const versionsText = () => {
  if (!RECOMMENDED) return "This version of the app recommends no update, so the reminder has nothing to show.";
  const recommended = `Apps on version code ${RECOMMENDED - 1} or older are reminded to update`;
  return REQUIRED ? `${recommended}, and those on ${REQUIRED - 1} or older are told they have to.` : `${recommended}.`;
};

const Setting = ({ checked, onChange, label, children }) => (
  <Box>
    <FormControlLabel
      control={<Switch checked={checked} onChange={(event) => onChange(event.target.checked)} />}
      label={<Typography sx={{ fontSize: 15, fontWeight: 700 }}>{label}</Typography>}
    />
    <Typography sx={{ mt: 0.5, fontSize: 13, color: "text.secondary" }}>{children}</Typography>
  </Box>
);

const UpdatePolicyForm = ({ policy }) => {
  const dispatch = useDispatch();
  const isSaving = useIsLoading(ChangeAppUpdates);
  const [isShown, setIsShown] = useState(policy.isShown);
  const [isListed, setIsListed] = useState(policy.isListed);
  const [reason, setReason] = useState("");

  const isChanged = isShown !== policy.isShown || isListed !== policy.isListed;

  const save = async () => {
    const result = await dispatch(ChangeAppUpdates({ isShown, isListed, reason }));
    if (ChangeAppUpdates.fulfilled.match(result)) setReason("");
  };

  return (
    <Stack spacing={3} sx={{ mt: 4, maxWidth: 560 }}>
      <Typography sx={{ fontSize: 14.5, color: "text.secondary" }}>
        The newest app is version code <b>{import.meta.env.REACT_APP_VERSION_CODE}</b>, built with version {import.meta.env.REACT_APP_VERSION}. {versionsText()}
      </Typography>

      <Setting checked={isShown} onChange={setIsShown} label="Show the update reminder">
        Turn it on once Google Play has the new version. Until then Play has nothing to offer, since a release reaches the app before Play finishes its review.
      </Setting>

      <Setting checked={isListed} onChange={setIsListed} label="Open to everyone on Google Play">
        Apps Play didn't install are sent to Whisprl's Play page to update. Leave this off while the app is only in testing, since most people couldn't open
        that page yet.
      </Setting>

      <TextField
        multiline
        minRows={2}
        label="Why"
        placeholder="This goes in the audit log"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />

      <Box>
        <Button variant="contained" loading={isSaving} disabled={!isChanged || !reason.trim()} onClick={save}>
          Save
        </Button>
        <Typography sx={{ mt: 1, fontSize: 13, color: "text.secondary" }}>Your passkey is asked for next.</Typography>
      </Box>
    </Stack>
  );
};

export default UpdatePolicyForm;
