import { useState } from "react";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { useDispatch } from "react-redux";

import useIsLoading from "@/hooks/useIsLoading";
import { RemoveAdmin } from "@/redux/slices/actions/adminActions";
import AccessDialog from "@/sections/admin/AccessDialog";
import PersonStatus from "@/sections/admin/PersonStatus";
import getAvatar from "@/utils/avatars";
import { permissionLabel } from "@/utils/roles";

const RemoveDialog = ({ member, onClose, onDone }) => {
  const dispatch = useDispatch();
  const isWorking = useIsLoading(RemoveAdmin);
  const [reason, setReason] = useState("");

  const remove = async () => {
    const result = await dispatch(RemoveAdmin({ userId: member._id, reason }));
    if (!RemoveAdmin.fulfilled.match(result)) return;
    onClose();
    onDone();
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{`Remove ${member.firstName} from the team?`}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14.5 }}>They lose the admin panel straight away. Their Whisprl account stays as it is.</DialogContentText>
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
        <Button variant="contained" color="error" loading={isWorking} disabled={!reason.trim()} onClick={remove}>
          Remove
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const TeamMember = ({ member, onChanged }) => {
  const [open, setOpen] = useState(null);
  const isOwner = member.role === "owner";
  const name = `${member.firstName} ${member.lastName}`;

  return (
    <Stack component="li" direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ py: 2, borderTop: 1, borderColor: "divider" }}>
      <Stack direction="row" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
        {getAvatar(member.avatar, name, 40)}
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{name}</Typography>
            <PersonStatus person={member} />
          </Stack>
          <Typography sx={{ fontSize: 13, color: "text.secondary", overflowWrap: "anywhere" }}>{member.email}</Typography>
          <Stack direction="row" aria-label={`What ${member.firstName} can use`} sx={{ flexWrap: "wrap", mt: 1, gap: 0.75 }}>
            {isOwner ? (
              <Chip size="small" color="primary" variant="outlined" label="Everything, and the team" />
            ) : (
              member.permissions.map((permission) => <Chip key={permission} size="small" variant="outlined" label={permissionLabel(permission)} />)
            )}
          </Stack>
        </Box>
      </Stack>

      {!isOwner && (
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignSelf: { sm: "flex-start" } }}>
          <Button size="small" variant="outlined" color="inherit" onClick={() => setOpen("access")}>
            Change access
          </Button>
          <Button size="small" variant="outlined" color="error" onClick={() => setOpen("remove")}>
            Remove
          </Button>
        </Stack>
      )}

      {open === "access" && <AccessDialog member={member} onClose={() => setOpen(null)} onDone={onChanged} />}
      {open === "remove" && <RemoveDialog member={member} onClose={() => setOpen(null)} onDone={onChanged} />}
    </Stack>
  );
};

export default TeamMember;
