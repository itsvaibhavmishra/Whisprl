import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  TextField,
  Typography,
} from "@mui/material";
import { useDispatch } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { AddAdmin, ChangeAccess } from "@/redux/slices/actions/adminActions";
import { PERMISSIONS } from "@/utils/roles";

// with no member it adds someone new, otherwise it changes what an admin can already do
const AccessDialog = ({ member, onClose, onDone }) => {
  const dispatch = useDispatch();
  const thunk = member ? ChangeAccess : AddAdmin;
  const isWorking = useIsLoading(thunk);
  const [email, setEmail] = useState("");
  const [chosen, setChosen] = useState(member?.permissions ?? []);
  const [reason, setReason] = useState("");

  const toggle = (value) => setChosen((current) => (current.includes(value) ? current.filter((permission) => permission !== value) : [...current, value]));

  const save = async () => {
    const permissions = PERMISSIONS.map(({ value }) => value).filter((value) => chosen.includes(value));
    const result = await dispatch(thunk({ permissions, reason, ...(member ? { userId: member._id } : { email }) }));
    if (!thunk.fulfilled.match(result)) return;
    onClose();
    onDone();
  };

  const isReady = chosen.length > 0 && reason.trim() && (member || email.trim());

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{member ? `Change what ${member.firstName} can do` : "Add an admin"}</DialogTitle>
      <DialogContent>
        {!member && (
          <TextField
            fullWidth
            autoFocus
            type="email"
            label="Their email"
            helperText="The one they log in to Whisprl with"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            sx={{ mt: 1 }}
          />
        )}
        <FormControl component="fieldset" sx={{ mt: 2.5, width: "100%" }}>
          <FormLabel component="legend" sx={{ fontSize: 14, fontWeight: 700, color: "text.primary" }}>
            What they can do
          </FormLabel>
          <FormGroup sx={{ mt: 1 }}>
            {PERMISSIONS.map(({ value, label, description }) => (
              <FormControlLabel
                key={value}
                control={<Checkbox checked={chosen.includes(value)} onChange={() => toggle(value)} />}
                label={
                  <Box>
                    <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{description}</Typography>
                  </Box>
                }
                sx={{ alignItems: "flex-start", py: 0.5, "& .MuiCheckbox-root": { pt: 0.25 } }}
              />
            ))}
          </FormGroup>
        </FormControl>
        <TextField
          fullWidth
          multiline
          minRows={2}
          label="Why"
          placeholder="This goes in the audit log"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          sx={{ mt: 2.5 }}
        />
        <DialogContentText sx={{ mt: 2, fontSize: 13 }}>Your passkey is asked for next.</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" loading={isWorking} disabled={!isReady} onClick={save}>
          {member ? "Save" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccessDialog;
